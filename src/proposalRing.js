import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {proposalRingPose,PROPOSAL_RING_DURATION} from './proposalRingMotion.js';

export async function createProposalRing(canvas,{reduced=false,onReveal}={}){
 const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});
 renderer.setClearColor(0,0);renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.3;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(35,1,.01,30);
 camera.position.set(1.05,1.1,1.8);camera.lookAt(0,.29,0);
 const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment(),environment=pmrem.fromScene(room,.04);
 scene.environment=environment.texture;room.dispose();pmrem.dispose();
 scene.add(new THREE.HemisphereLight(0xfff2df,0x55435d,2));
 const light=new THREE.DirectionalLight(0xffe9cb,4);light.position.set(-2,3,3);light.castShadow=true;light.shadow.mapSize.set(1024,1024);light.shadow.bias=-.001;scene.add(light);
 const fill=new THREE.DirectionalLight(0xe6dcff,1.4);fill.position.set(2,1,-2);scene.add(fill);
 let velvetTexture;
 try{velvetTexture=await new THREE.TextureLoader().loadAsync('/velvet-pile-v3.png');velvetTexture.colorSpace=THREE.SRGBColorSpace;velvetTexture.wrapS=velvetTexture.wrapT=THREE.RepeatWrapping;velvetTexture.repeat.set(2,2)}catch{/* physical velvet still renders without the texture */}
 const velvet=new THREE.MeshPhysicalMaterial({color:0x54213f,map:velvetTexture,bumpMap:velvetTexture,bumpScale:.007,roughness:.94,sheen:1,sheenRoughness:.85,sheenColor:0x9d6382,metalness:0});
 const cream=new THREE.MeshPhysicalMaterial({color:0xf2e7d4,roughness:.86,sheen:.5});
 const gold=new THREE.MeshStandardMaterial({color:0xe7bd68,metalness:1,roughness:.18});
 const diamond=new THREE.MeshPhysicalMaterial({color:0xffffff,metalness:0,roughness:.02,transmission:.92,thickness:.13,ior:2.42,clearcoat:1,envMapIntensity:2.8});
 const shapes=[];
 function rounded(width,height,depth,radius,material){
  const x=-width/2,y=-height/2,s=new THREE.Shape();
  s.moveTo(x+radius,y);s.lineTo(-x-radius,y);s.quadraticCurveTo(-x,y,-x,y+radius);s.lineTo(-x,-y-radius);s.quadraticCurveTo(-x,-y,-x-radius,-y);s.lineTo(x+radius,-y);s.quadraticCurveTo(x,-y,x,-y-radius);s.lineTo(x,y+radius);s.quadraticCurveTo(x,y,x+radius,y);
  const geometry=new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelThickness:.012,bevelSize:.012,bevelSegments:4,steps:1,curveSegments:20});geometry.translate(0,0,-depth/2);shapes.push(geometry);
  const mesh=new THREE.Mesh(geometry,material);mesh.castShadow=true;mesh.receiveShadow=true;return mesh;
 }
 // A shallow velvet base, with an actual inset cushion and a hinged rigid lid.
 const base=rounded(.88,.7,.2,.075,velvet);base.rotation.x=-Math.PI/2;scene.add(base);
 const cushion=rounded(.78,.6,.035,.065,velvet);cushion.rotation.x=-Math.PI/2;cushion.position.y=.103;scene.add(cushion);
 const slit=new THREE.Mesh(new THREE.BoxGeometry(.34,.008,.018),new THREE.MeshStandardMaterial({color:0x220c1b,roughness:1}));slit.position.set(0,.127,.06);scene.add(slit);
 const hinge=new THREE.Group();hinge.position.set(0,.115,-.35);scene.add(hinge);
 const lid=rounded(.88,.7,.1,.075,velvet);lid.rotation.x=-Math.PI/2;lid.position.set(0,.055,.35);hinge.add(lid);
 const lining=rounded(.76,.58,.012,.06,cream);lining.rotation.x=-Math.PI/2;lining.position.set(0,-.007,.35);hinge.add(lining);
 const ring=new THREE.Group();ring.position.z=.055;scene.add(ring);
 const band=new THREE.Mesh(new THREE.TorusGeometry(.118,.017,24,96),gold);band.castShadow=true;ring.add(band);
 const setting=new THREE.Mesh(new THREE.CylinderGeometry(.045,.025,.035,8),gold);setting.position.y=.133;ring.add(setting);
 const stone=new THREE.Mesh(new THREE.OctahedronGeometry(.06,0),diamond);stone.scale.set(1,.8,1);stone.position.y=.172;stone.rotation.y=Math.PI/4;ring.add(stone);
 for(let i=0;i<4;i++){const claw=new THREE.Mesh(new THREE.SphereGeometry(.009,12,12),gold);claw.position.set(Math.cos(i*Math.PI/2+.785)*.038,.165,Math.sin(i*Math.PI/2+.785)*.038);ring.add(claw)}
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(4,4),new THREE.ShadowMaterial({opacity:.16}));floor.rotation.x=-Math.PI/2;floor.position.y=-.115;floor.receiveShadow=true;scene.add(floor);
 let elapsed=0,start=0,raf=0,dead=false,revealed=false;
 function render(){const pose=proposalRingPose(elapsed,reduced);hinge.rotation.x=pose.lidAngle;ring.position.y=pose.ringHeight;ring.visible=pose.ringVisible;diamond.envMapIntensity=2.8+pose.glint*1.3;renderer.render(scene,camera);if(!revealed&&(reduced||elapsed>=4.9)){revealed=true;onReveal?.()}}
 const resize=()=>{const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();render()};
 const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
 function frame(now){if(dead)return;if(!start)start=now;elapsed=Math.min(PROPOSAL_RING_DURATION,(now-start)/1000);render();if(elapsed<PROPOSAL_RING_DURATION)raf=requestAnimationFrame(frame)}
 return {play(){if(dead)return;if(reduced){elapsed=PROPOSAL_RING_DURATION;render()}else if(!raf)raf=requestAnimationFrame(frame)},destroy(){dead=true;cancelAnimationFrame(raf);observer.disconnect();scene.traverse(o=>{o.geometry?.dispose();if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose()});velvetTexture?.dispose();environment.dispose();renderer.dispose();renderer.forceContextLoss?.()}};
}
