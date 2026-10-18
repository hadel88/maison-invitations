import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const ease = x => { x = Math.max(0, Math.min(1, x)); return x*x*x*(x*(x*6-15)+10); };

export function createBeachScene(host, { onTap, onReady, onError } = {}) {
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(42, 1, .1, 150);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .9;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  host.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-hidden', 'true');
  const pmrem = new THREE.PMREMGenerator(renderer), room = new RoomEnvironment();
  let environment = pmrem.fromScene(room, .05);
  scene.environment = environment.texture; room.dispose(); pmrem.dispose();
  scene.add(new THREE.HemisphereLight('#ffe8c6', '#8b657b', .9));
  const sunLight = new THREE.DirectionalLight('#ffd3a0', 2.7); sunLight.position.set(-3,8,5); sunLight.castShadow=true;
  sunLight.shadow.mapSize.set(1024,1024); Object.assign(sunLight.shadow.camera,{left:-7,right:7,top:9,bottom:-3}); sunLight.shadow.bias=-.001;
  scene.add(sunLight);
  const fill = new THREE.DirectionalLight('#b0d5e6',.65);fill.position.set(5,3,-3);scene.add(fill);
  const skyCanvas=document.createElement('canvas');skyCanvas.width=16;skyCanvas.height=512;
  const skyContext=skyCanvas.getContext('2d'), skyGradient=skyContext.createLinearGradient(0,0,0,512);
  for(const [at,color]of[[0,'#706c97'],[.43,'#d99c9d'],[.68,'#ffcd9a'],[1,'#edc2a0']])skyGradient.addColorStop(at,color);
  skyContext.fillStyle=skyGradient;skyContext.fillRect(0,0,16,512);
  const skyTexture=new THREE.CanvasTexture(skyCanvas);skyTexture.colorSpace=THREE.SRGBColorSpace;scene.background=skyTexture;
  const textures=[skyTexture];let backdrop=null;
  function fitBackdrop(){if(!backdrop?.image)return;const aspect=camera.aspect,imageAspect=backdrop.image.width/backdrop.image.height;backdrop.repeat.set(Math.min(1,aspect/imageAspect),Math.min(1,imageAspect/aspect));backdrop.offset.set(Math.max(0,Math.min(1-backdrop.repeat.x,.45-backdrop.repeat.x/2)),(1-backdrop.repeat.y)/2);backdrop.updateMatrix();}
  const sandCanvas=document.createElement('canvas');sandCanvas.width=sandCanvas.height=256;
  const sc=sandCanvas.getContext('2d');sc.fillStyle='#d6b991';sc.fillRect(0,0,256,256);
  let seed=17;for(let i=0;i<16000;i++){seed=(seed*1664525+1013904223)>>>0;const x=seed%256;seed=(seed*1664525+1013904223)>>>0;sc.fillStyle=i%2?'#b0927130':'#fff6d944';sc.fillRect(x,seed%256,1,1);}
  const sandTexture=new THREE.CanvasTexture(sandCanvas);sandTexture.wrapS=sandTexture.wrapT=THREE.RepeatWrapping;sandTexture.repeat.set(12,12);sandTexture.colorSpace=THREE.SRGBColorSpace;textures.push(sandTexture);
  const sand=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.MeshStandardMaterial({map:sandTexture,roughness:.95,color:'#f5dfc0'}));sand.rotation.x=-Math.PI/2;sand.position.set(0,-.06,-30);sand.receiveShadow=true;scene.add(sand);
  const waterGeometry=new THREE.PlaneGeometry(100,70,70,50);waterGeometry.rotateX(-Math.PI/2);
  const water=new THREE.Mesh(waterGeometry,new THREE.MeshStandardMaterial({color:'#b9a7b3',metalness:.42,roughness:.23,transparent:true,opacity:.88}));water.position.set(0,-.015,-40);scene.add(water);
  const baseWater=waterGeometry.attributes.position.array.slice();
  const sun=new THREE.Mesh(new THREE.SphereGeometry(2.4,32,24),new THREE.MeshBasicMaterial({color:'#fff2c5'}));sun.position.set(-8,4,-55);scene.add(sun);
  const gold=new THREE.MeshStandardMaterial({color:'#dcb76c',metalness:.92,roughness:.23});
  const ivory=new THREE.MeshStandardMaterial({color:'#fff0d8',roughness:.6});
  const rose=new THREE.MeshStandardMaterial({color:'#c65772',metalness:.15,roughness:.28});
  const velvet=new THREE.MeshStandardMaterial({color:'#5f223b',roughness:.95});
  const leafMaterial=new THREE.MeshStandardMaterial({color:'#577764',roughness:.75,side:THREE.DoubleSide});
  const mesh=(geometry,material,parent,x=0,y=0,z=0)=>{const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;};
  const rounded=(w,h,d,r=.06)=>new RoundedBoxGeometry(w,h,d,3,r);
  const doors=new THREE.Group();scene.add(doors);
  const pivots=[];
  for(const side of[-1,1]){
    const pivot=new THREE.Group();pivot.position.set(side*2.05,0,1);doors.add(pivot);pivots.push(pivot);
    mesh(rounded(2.04,5.4,.17),gold,pivot,-side*1.02,2.7,0);
    mesh(rounded(1.7,4.96,.05),new THREE.MeshStandardMaterial({color:'#ad8245',metalness:.7,roughness:.4}),pivot,-side*1.02,2.7,.11);
    for(const y of[1.4,3.8]){
      const panel=mesh(rounded(1.4,2,.07),gold,pivot,-side*1.02,y,.16);
      mesh(rounded(1.22,1.82,.08),new THREE.MeshStandardMaterial({color:'#b38b50',metalness:.75,roughness:.32}),pivot,panel.position.x,y,.20);
    }
    mesh(new THREE.TorusGeometry(.16,.035,12,28),gold,pivot,-side*1.86,2.65,.3);
    mesh(new THREE.SphereGeometry(.065,16,12),gold,pivot,-side*1.86,2.88,.29);
  }
  for(const side of[-1,1]){mesh(rounded(.22,5.7,.34),gold,doors,side*2.18,2.8,.98);mesh(rounded(.45,.15,.55),gold,doors,side*2.18,.075,.98);}
  mesh(rounded(4.6,.2,.4),gold,doors,0,5.55,1);
  const doorHit=mesh(new THREE.PlaneGeometry(4.4,5.7),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}),doors,0,2.8,1.3);doorHit.castShadow=false;doorHit.receiveShadow=false;
  // Every chapter occupies the same physical beach. The camera travels through
  // the doorway, rather than replacing objects at the camera's focal point.
  const heart=new THREE.Group();scene.add(heart);heart.position.set(0,2.4,-10);
  const heartShape=new THREE.Shape();heartShape.moveTo(0,-.85);heartShape.bezierCurveTo(-1.6,.1,-1.5,1.65,0,.8);heartShape.bezierCurveTo(1.5,1.65,1.6,.1,0,-.85);
  const heartGeometry=new THREE.ExtrudeGeometry(heartShape,{depth:.20,bevelEnabled:true,bevelSegments:5,steps:1,bevelSize:.12,bevelThickness:.12,curveSegments:32});
  mesh(heartGeometry,rose,heart);heart.scale.setScalar(.67);
  const heartRim=mesh(heartGeometry,gold,heart,0,0,-.06);heartRim.scale.setScalar(1.06);
  const heartHalo=mesh(new THREE.TorusGeometry(1.1,.012,8,90),gold,heart,0,.12,-.08);heartHalo.rotation.y=.3;
  const box=new THREE.Group();box.position.set(3.4,1.1,-15);scene.add(box);
  mesh(rounded(2,.75,1.65,.13),velvet,box);
  mesh(rounded(1.84,.08,1.48,.05),gold,box,0,.38,0);
  mesh(rounded(1.72,.09,1.37,.05),velvet,box,0,.43,0);
  const boxHit=mesh(new THREE.PlaneGeometry(2.5,1.8),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}),box,0,.4,1);boxHit.castShadow=false;boxHit.receiveShadow=false;
  const lid=new THREE.Group();lid.position.set(0,.4,-.78);box.add(lid);
  mesh(rounded(2,.27,1.65,.10),velvet,lid,0,.13,.78);
  mesh(rounded(1.82,.035,1.45,.04),gold,lid,0,-.015,.78);
  const ring=new THREE.Group();box.add(ring);ring.position.set(0,.56,0);
  mesh(new THREE.TorusGeometry(.31,.055,16,64),gold,ring);
  const gemMaterial=new THREE.MeshPhysicalMaterial({color:'#fff6ec',metalness:0,roughness:.02,transmission:.65,thickness:.5,ior:2.4});
  const gem=mesh(new THREE.OctahedronGeometry(.19,0),gemMaterial,ring,0,.4,0);gem.rotation.z=Math.PI/4;
  for(const x of[-.12,.12])mesh(new THREE.CylinderGeometry(.012,.016,.13,8),gold,ring,x,.36,0);
  const arch=new THREE.Group();arch.position.set(0,0,-25);scene.add(arch);
  const archPoints=[];for(let i=0;i<=56;i++){const a=i/56*Math.PI;archPoints.push(new THREE.Vector3(Math.cos(a)*2.05,1+Math.sin(a)*3.8,0));}
  for(const z of[-.12,.12]){const curve=new THREE.CatmullRomCurve3(archPoints.map(p=>p.clone().add(new THREE.Vector3(0,0,z))));mesh(new THREE.TubeGeometry(curve,80,.055,8,false),gold,arch);}
  for(const side of[-1,1]){mesh(new THREE.CylinderGeometry(.055,.055,1,12),gold,arch,side*2.05,.5,0);mesh(rounded(.55,.12,.55),ivory,arch,side*2.05,0,0);}
  // Thin curved petals overlap into rosettes; the flowers are not stacked spheres.
  const petalPositions=[],petalIndices=[],nu=8,nv=7;
  for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){
    const u=i/nu,v=j/nv;
    petalPositions.push((u-.5)*Math.sin(Math.PI*v)*.95,v*.8,.30*Math.sin(Math.PI*v)+Math.sin(u*Math.PI)*v*.15);
    if(i<nu&&j<nv){const k=j*(nu+1)+i;petalIndices.push(k,k+1,k+nu+1,k+1,k+nu+2,k+nu+1);}
  }
  const petalGeometry=new THREE.BufferGeometry();petalGeometry.setAttribute('position',new THREE.Float32BufferAttribute(petalPositions,3));petalGeometry.setIndex(petalIndices);petalGeometry.computeVertexNormals();
  const count=78,flowers=new THREE.InstancedMesh(petalGeometry,new THREE.MeshStandardMaterial({roughness:.65,side:THREE.DoubleSide}),count*12),leaves=new THREE.InstancedMesh(new THREE.SphereGeometry(1,8,6),leafMaterial,count*2),dummy=new THREE.Object3D();
  for(let i=0;i<count;i++){
    const a=(i/(count-1))*Math.PI,center=new THREE.Vector3(Math.cos(a)*2.05,1+Math.sin(a)*3.8,0);
    center.x+=Math.sin(i*19)*.16;center.y+=Math.cos(i*7)*.13;
    for(let petal=0;petal<12;petal++){
      const ringIndex=petal<6?0:petal<10?1:2,number=ringIndex===0?6:ringIndex===1?4:2,index=petal-(ringIndex===0?0:ringIndex===1?6:10),angle=index/number*Math.PI*2+i*.7+ringIndex*.8,size=.23-ringIndex*.055;
      dummy.position.copy(center).add(new THREE.Vector3(0,0,.13+ringIndex*.035));dummy.rotation.set(.12*Math.cos(angle),.12*Math.sin(angle),angle);dummy.scale.set(size,size,size);dummy.updateMatrix();flowers.setMatrixAt(i*12+petal,dummy.matrix);flowers.setColorAt(i*12+petal,new THREE.Color(i%3===0?'#e2a4ab':i%3===1?'#fff0d7':'#c9798d').lerp(new THREE.Color('#fff3df'),ringIndex*.08));
    }
    for(let j=0;j<2;j++){dummy.position.copy(center).add(new THREE.Vector3((j?1:-1)*.17,Math.sin(i)*.16,-.01));dummy.rotation.set(.3,j?.7:-.7,i);dummy.scale.set(.12,.24,.025);dummy.updateMatrix();leaves.setMatrixAt(i*2+j,dummy.matrix);}
  }
  flowers.castShadow=true;arch.add(flowers,leaves);
  const archHit=mesh(new THREE.PlaneGeometry(4.6,5.1),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}),arch,0,2.5,0);
  archHit.castShadow=false;archHit.receiveShadow=false;
  const lanternMaterial=new THREE.MeshStandardMaterial({color:'#fff0c5',emissive:'#ffb95e',emissiveIntensity:2,roughness:.35});
  for(let i=0;i<16;i++){
    const x=i%2?-2.8:2.8,z=3-Math.floor(i/2)*4;
    const lantern=new THREE.Group();lantern.position.set(x,.2,z);scene.add(lantern);
    mesh(new THREE.CylinderGeometry(.13,.17,.34,12),lanternMaterial,lantern);
    mesh(new THREE.CylinderGeometry(.2,.2,.035,16),gold,lantern,0,-.18);
    mesh(new THREE.TorusGeometry(.18,.018,8,24),gold,lantern,0,.3,0);
  }
  // A quiet stone threshold and columns anchor the entrance in real space.
  const limestone=new THREE.MeshStandardMaterial({color:'#e8d2ae',roughness:.86,bumpMap:sandTexture,bumpScale:.025});
  mesh(rounded(5.3,.12,2.1,.05),limestone,scene,0,-.04,1);
  for(const side of[-1,1]){
    const column=new THREE.Group();column.position.set(side*2.65,0,1);scene.add(column);
    mesh(new THREE.CylinderGeometry(.23,.28,5.5,24),limestone,column,0,2.75);
    for(const y of[.12,.3,5.3,5.5])mesh(rounded(.75,.12,.75),limestone,column,0,y);
    for(let j=0;j<12;j++){
      const angle=j/12*Math.PI*2;
      mesh(new THREE.CylinderGeometry(.018,.018,4.7,6),limestone,column,Math.sin(angle)*.235,2.75,Math.cos(angle)*.235);
    }
    for(const y of[.4,5.15])mesh(new THREE.TorusGeometry(.25,.025,8,32),gold,column,0,y).rotation.x=Math.PI/2;
  }
  // Linen lining, inset grain, hinges and mouldings give the leaves thickness.
  const grainCanvas=document.createElement('canvas');grainCanvas.width=grainCanvas.height=256;
  const gc=grainCanvas.getContext('2d');gc.fillStyle='#b99a6b';gc.fillRect(0,0,256,256);
  for(let i=0;i<350;i++){gc.strokeStyle=i%2?'#6d4c2c12':'#fff2d71a';gc.beginPath();gc.moveTo(i*.8,0);gc.bezierCurveTo(i*.8+Math.sin(i)*3,80,i*.8-2,180,i*.8,256);gc.stroke();}
  const grain=new THREE.CanvasTexture(grainCanvas);grain.colorSpace=THREE.SRGBColorSpace;textures.push(grain);
  for(const [i,pivot]of pivots.entries()){
    const side=i===0?-1:1;
    pivot.traverse(o=>{if(o.isMesh&&o.geometry.type==='RoundedBoxGeometry'){o.material=o.material.clone();o.material.bumpMap=grain;o.material.bumpScale=.018;}});
    mesh(rounded(1.83,5.12,.04),limestone,pivot,-side*1.02,2.7,-.11);
    for(const y of[.65,2.7,4.75])mesh(new THREE.CylinderGeometry(.055,.055,.28,12),gold,pivot,0,y,.02);
  }
  // The ring box rests on a plinth; it is not suspended in the air.
  mesh(new THREE.CylinderGeometry(.72,.85,.72,48),limestone,scene,3.4,.36,-15);
  mesh(new THREE.CylinderGeometry(.88,.88,.12,48),limestone,scene,3.4,.76,-15);
  const particlePositions=new Float32Array(64*3);for(let i=0;i<64;i++){particlePositions[i*3]=Math.sin(i*7.2)*4;particlePositions[i*3+1]=(i%17)/17*6;particlePositions[i*3+2]=Math.cos(i*11)*3;}
  const particleGeometry=new THREE.BufferGeometry();particleGeometry.setAttribute('position',new THREE.BufferAttribute(particlePositions,3));
  const particles=new THREE.Points(particleGeometry,new THREE.PointsMaterial({color:'#ffe5b5',size:.035,transparent:true,opacity:.75,depthWrite:false}));scene.add(particles);
  let chapter=0,action=-1,elapsed=0,elapsedTime=0,last=0,raf=0,disposed=false,done=null,baseZ=10;
  const backdropLoader=new THREE.TextureLoader();
  backdropLoader.load('/beach-sunset-environment.webp',texture=>{
    if(disposed){texture.dispose();return;}
    texture.colorSpace=THREE.SRGBColorSpace;
    textures.push(texture);backdrop=texture;fitBackdrop();scene.background=texture;sun.visible=false;water.visible=false;
    const oldSandMaterial=sand.material;sand.material=new THREE.ShadowMaterial({color:'#4a2d22',opacity:.22});oldSandMaterial.dispose();
    const generator=new THREE.PMREMGenerator(renderer),nextEnvironment=generator.fromEquirectangular(texture);generator.dispose();environment.dispose();environment=nextEnvironment;scene.environment=environment.texture;
  },undefined,()=>{});
  backdropLoader.load('/craft-cotton-paper.webp',texture=>{if(disposed){texture.dispose();return;}texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(3,3);velvet.bumpMap=texture;velvet.bumpScale=.035;velvet.needsUpdate=true;textures.push(texture);},undefined,()=>{});
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function visible(){doors.visible=true;heart.visible=chapter<=1;box.visible=true;arch.visible=true;ring.visible=chapter>=3;}
  visible();
  function resize(){const r=host.getBoundingClientRect();camera.aspect=r.width/Math.max(r.height,1);camera.updateProjectionMatrix();baseZ=Math.max(9.3,6.8/camera.aspect);renderer.setSize(r.width,r.height,false);fitBackdrop();}
  const observer=new ResizeObserver(resize);observer.observe(host);resize();
  function draw(now){
    if(disposed)return;const dt=Math.min((now-last)/1000||0,.05);last=now;
    if(!document.hidden){
      elapsedTime+=dt;const t=reduced?0:elapsedTime;
      const distance=Math.max(8,baseZ*.62);
      const poses=[[2.9,baseZ,2.6,0,0],[2.6,-10+distance,2.4,-10,0],[2.35,-15+distance*.9,1.65,-15,3.4],[2.9,-25+baseZ*.95,2.6,-25,0],[2.9,-25+baseZ*.9,2.6,-25,0]],view=[...poses[Math.min(chapter,4)]];
      heart.position.y=2.4+Math.sin(t*1.4)*.12;heart.rotation.y=Math.sin(t*.65)*.22;
      particles.rotation.y=t*.025;particles.position.y=Math.sin(t*.3)*.07;
      const positions=waterGeometry.attributes.position.array;if(water.visible)for(let i=0;i<positions.length;i+=3)positions[i+1]=baseWater[i+1]+Math.sin(positions[i]*.5+t*.7)*.035+Math.cos(positions[i+2]*.8+t)*.018;if(water.visible)waterGeometry.attributes.position.needsUpdate=true;
      if(action>=0){
        elapsed+=dt;const duration=[6.5,3.4,5.5,3][action],p=reduced?1:ease(elapsed/duration);
        const from=poses[action],to=poses[action+1];for(let i=0;i<5;i++)view[i]=from[i]+(to[i]-from[i])*p;
        if(action===0){const open=reduced?1:ease(Math.min(1,elapsed/3.2));pivots[0].rotation.y=-open*1.85;pivots[1].rotation.y=open*1.85;const travel=reduced?1:ease((elapsed-1.2)/5.3);for(let i=0;i<5;i++)view[i]=from[i]+(to[i]-from[i])*travel;}
        if(action===1){heart.position.x=-ease(p)*2.4;heart.rotation.y=p*.8;}
        if(action===2){const close=[1.95,-15+distance*.7,1.65,-15,3.4],a=p<.65?from:close,b=p<.65?close:to,q=p<.65?ease(p/.65):ease((p-.65)/.35);for(let i=0;i<5;i++)view[i]=a[i]+(b[i]-a[i])*q;lid.rotation.x=-ease(Math.min(1,p*2.2))*1.65;ring.visible=true;ring.position.y=.56+ease(p)*.24;}
        if(action===3){arch.scale.setScalar(1+Math.sin(p*Math.PI)*.035);particles.rotation.z=p*.16;}
        if(p>=1){const completed=done;chapter=action+1;action=-1;visible();heart.scale.setScalar(.67);box.scale.setScalar(1);arch.scale.setScalar(1);completed?.();}
      }
      camera.position.set(view[4]+(reduced?0:Math.sin(t*.14)*.045),view[0],view[1]);camera.lookAt(view[4],view[2],view[3]);
      renderer.render(scene,camera);
    }
    raf=requestAnimationFrame(draw);
  }
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let down=null;
  function pointerDown(e){down=[e.clientX,e.clientY];}
  function pointerUp(e){
    if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>18)return;down=null;
    if(action>=0||chapter>=4)return;const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);
    if(raycaster.intersectObject([doors,heart,box,arch][chapter],true).length)onTap?.();
  }
  const lost=e=>{e.preventDefault();cancelAnimationFrame(raf);onError?.();};renderer.domElement.addEventListener('pointerdown',pointerDown);renderer.domElement.addEventListener('pointerup',pointerUp);renderer.domElement.addEventListener('webglcontextlost',lost);
  raf=requestAnimationFrame(draw);onReady?.();
  return {
    play(step,complete){if(disposed||action>=0||step!==chapter||step>3)return;action=step;elapsed=0;done=complete;},
    reset(){chapter=0;action=-1;done=null;pivots.forEach(p=>p.rotation.y=0);lid.rotation.x=0;heart.position.x=0;heart.scale.setScalar(.67);box.scale.setScalar(1);box.rotation.y=0;arch.scale.setScalar(1);visible();},
    dispose(){disposed=true;cancelAnimationFrame(raf);observer.disconnect();renderer.domElement.removeEventListener('pointerdown',pointerDown);renderer.domElement.removeEventListener('pointerup',pointerUp);renderer.domElement.removeEventListener('webglcontextlost',lost);const geometries=new Set(),materials=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());environment.dispose();renderer.dispose();renderer.domElement.remove();},
  };
}
