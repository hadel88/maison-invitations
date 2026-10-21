import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ribbonRow } from './roseRibbonGeometry';

function clothTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d'), pixels = ctx.createImageData(256, 256);
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    // Dense velvet pile: fine irregular fibres, without a visible woven grid.
    const hash = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    const weave = ((hash - Math.floor(hash)) - .5) * 9;
    const grain = Math.sin(x * .045 + Math.sin(y * .026)) * 4 + Math.cos(y * .037) * 2;
    const value = 246 + weave + grain;
    const i = (y * 256 + x) * 4;
    pixels.data.set([value, value, value, 255], i);
  }
  ctx.putImageData(pixels, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.repeat.set(4, 1.8);
  return texture;
}

function clothReliefTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d'), pixels = ctx.createImageData(256, 256);
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    const hash = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    const warp = (hash - Math.floor(hash) - .5) * 16;
    const weft = Math.sin(y * 1.9 + Math.sin(x * .08)) * 3;
    const grain = Math.sin(x * .045 + y * .025) * 2;
    const value = Math.max(0, Math.min(255, 128 + warp + weft + grain));
    const i = (y * 256 + x) * 4;
    pixels.data.set([value, value, value, 255], i);
  }
  ctx.putImageData(pixels, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 1.8);
  return texture;
}

// Short, raised pile follows the existing cloth surface. These sparse fibres
// soften its silhouette rather than painting a darker colour onto the bow.
function velvetPileTexture() {
  const c=document.createElement('canvas');c.width=c.height=512;
  const g=c.getContext('2d');g.fillStyle='#000';g.fillRect(0,0,512,512);
  for(let i=0;i<26000;i++){
    const hash=n=>{const v=Math.sin(n*127.1+91.7)*43758.5453;return v-Math.floor(v)};
    const x=hash(i*3)*512,y=hash(i*3+1)*512;
    g.strokeStyle=`rgba(255,255,255,${.4+hash(i*3+2)*.6})`;
    g.lineWidth=.6;g.beginPath();g.moveTo(x,y);g.lineTo(x+.45,y+1.5+hash(i)*2);g.stroke();
  }
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(3,1.8);return t;
}

export function createRibbonRenderer(canvas, { onReady, onComplete, onError, static: still = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: still, powerPreference: 'low-power' });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(2 * Math.atan(1 / 2.6) * 180 / Math.PI, 1, .1, 100);
  const pmrem = new THREE.PMREMGenerator(renderer), room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, .04, .1, 100);
  scene.environment = environment.texture;
  scene.environmentIntensity = .70;
  room.dispose(); pmrem.dispose();

  const light = new THREE.DirectionalLight(0xfff4eb, 1.5);
  light.position.set(-3, 6, 9);
  light.target.position.set(0, -.4, 0);
  light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024);
  Object.assign(light.shadow.camera, { left: -7, right: 7, top: 7, bottom: -9, near: .1, far: 35 });
  light.shadow.bias = -.0003;
  light.shadow.normalBias = .018;
  light.shadow.radius = 3;
  scene.add(light, light.target, new THREE.HemisphereLight(0xfff6ef, 0x87606c, .4));
  const fill = new THREE.DirectionalLight(0xffe5e3, .7);
  fill.position.set(5, 1, 6); scene.add(fill);

  const weave = clothTexture();
  const relief = clothReliefTexture();
  const material = new THREE.MeshPhysicalMaterial({
    color: '#d8a5ad', map: weave, metalness: 0, roughness: .94,
    specularIntensity: .16,
    sheen: 1, sheenColor: '#e8bcc6', sheenRoughness: .88,
    anisotropy: 0, anisotropyRotation: Math.PI / 2,
    bumpMap: relief, bumpScale: .014, side: THREE.DoubleSide,
    clearcoat: 0, clearcoatRoughness: 1,
    envMapIntensity: .2,
  });
  material.shadowSide = THREE.DoubleSide;
  const pileTexture=velvetPileTexture();
  const pileMaterials=[.006,.012,.02].map((height,index)=>{
    const pile=new THREE.MeshPhysicalMaterial({color:'#d8a5ad',alphaMap:pileTexture,transparent:true,
      opacity:.42-index*.08,alphaTest:.09,depthWrite:false,roughness:1,metalness:0,
      sheen:1,sheenColor:'#e8bcc6',sheenRoughness:.9,side:THREE.DoubleSide,envMapIntensity:.2});
    pile.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',
      `#include <begin_vertex>\n transformed += normalize(objectNormal) * ${height.toFixed(3)};`)};
    pile.customProgramCacheKey=()=>`maison-raised-velvet-${height}`;
    return pile;
  });
  const nu = 96, nv = 18, indices = [];
  for (let u = 0; u < nu; u++) for (let v = 0; v < nv; v++) {
    const a = u * (nv + 1) + v;
    indices.push(a, a + 1, a + nv + 1, a + 1, a + nv + 2, a + nv + 1);
  }
  const surfaces = [];
  function addSurface(side, type) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array((nu + 1) * (nv + 1) * 3);
    const uv = new Float32Array((nu + 1) * (nv + 1) * 2);
    for (let u = 0; u <= nu; u++) for (let v = 0; v <= nv; v++) {
      const i = (u * (nv + 1) + v) * 2;
      uv[i] = u / nu; uv[i + 1] = v / nv;
    }
    geometry.setIndex(indices);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    // Shared animated geometry: no independent movement, timing or new bow shape.
    for(const pileMaterial of pileMaterials){
      const fibres=new THREE.Mesh(geometry,pileMaterial);fibres.frustumCulled=false;mesh.add(fibres);
    }
    scene.add(mesh); surfaces.push({ geometry, positions, side, type, mesh });
  }
  for (const side of [-1, 1]) for (const type of ['band', 'tail', 'loop']) addSurface(side, type);
  addSurface(1, 'knot');
  const shadowGeometry = new THREE.PlaneGeometry(40, 50);
  const shadowMaterial = new THREE.ShadowMaterial({ color: 0x58353d, opacity: .12 });
  const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
  shadow.position.z = -.85;
  shadow.receiveShadow = true;
  scene.add(shadow);

  let running = false, elapsed = 0, started = 0, raf = 0, disposed = false, complete = false, queued = false;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function geometryAt(time) {
    for (const s of surfaces) {
      let index = 0;
      for (let u = 0; u <= nu; u++) {
        const sample = ribbonRow(u / nu, s.side, s.type, time);
        for (let v = 0; v <= nv; v++) {
          const p = sample(v / nv);
          s.positions[index++] = p[0]; s.positions[index++] = p[1]; s.positions[index++] = p[2];
        }
      }
      s.geometry.attributes.position.needsUpdate = true;
      s.geometry.computeVertexNormals();
    }
  }
  function render(time) {
    const visible = time < 5.2 && !(reduced && running);
    for (const s of surfaces) s.mesh.visible = visible;
    shadow.visible = visible;
    if (visible) geometryAt(time);
    renderer.render(scene, camera);
  }
  function frame(now) {
    queued = false;
    if (disposed) return;
    if (running) elapsed = (now - started) / 1000;
    render(elapsed);
    if (running && (elapsed >= 5.2 || reduced)) {
      running = false; complete = true; onComplete?.();
    }
    if (running) schedule();
  }
  function schedule() { if (!queued && !disposed) { queued = true; raf = requestAnimationFrame(frame); } }
  function resize() {
    if (disposed) return;
    const box = canvas.getBoundingClientRect();
    const width = Math.max(1, box.width), height = Math.max(1, box.height);
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, still ? 1.5 : 2));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.position.set(0, 0, Math.max(7.2, .15 + 6.45 / camera.aspect));
    camera.updateProjectionMatrix(); schedule();
  }
  const observer = new ResizeObserver(resize); observer.observe(canvas);
  resize(); render(0); onReady?.();
  const lost = event => { event.preventDefault(); cancelAnimationFrame(raf); running = false; onError?.(); };
  canvas.addEventListener('webglcontextlost', lost);
  return {
    capture() { render(elapsed); return canvas.toDataURL('image/png'); },
    open() { if (still || running || complete) return; running = true; started = performance.now(); schedule(); },
    reset() { running = false; complete = false; elapsed = 0; started = 0; schedule(); },
    dispose() {
      disposed = true; cancelAnimationFrame(raf); observer.disconnect();
      canvas.removeEventListener('webglcontextlost', lost);
      for (const s of surfaces) s.geometry.dispose();
      material.dispose(); weave.dispose(); relief.dispose(); pileTexture.dispose(); pileMaterials.forEach(m=>m.dispose()); shadowGeometry.dispose(); shadowMaterial.dispose();
      environment.dispose(); light.shadow.map?.dispose(); renderer.dispose();
    },
  };
}
