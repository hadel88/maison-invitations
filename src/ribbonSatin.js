import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ribbonRow } from './roseRibbonGeometry';

function clothTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d'), pixels = ctx.createImageData(256, 256);
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    const weave = ((x + y) & 1) ? 2.4 : -2.4;
    const grain = Math.sin(x * .21 + Math.sin(y * .08)) * 1.8 + Math.cos(y * .18) * 1.5;
    const value = 246 + weave + grain;
    const i = (y * 256 + x) * 4;
    pixels.data.set([value, value, value, 255], i);
  }
  ctx.putImageData(pixels, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(14, 6);
  return texture;
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
  const material = new THREE.MeshPhysicalMaterial({
    color: '#d8a5ad', metalness: 0, roughness: .82,
    transparent: true, opacity: .99, alphaMap: weave, depthWrite: false,
    specularIntensity: .18,
    sheen: .26, sheenColor: '#f4d9da', sheenRoughness: .74,
    anisotropy: .18, anisotropyRotation: Math.PI / 2,
    bumpMap: weave, bumpScale: .04, side: THREE.DoubleSide,
    envMapIntensity: .35,
  });
  material.shadowSide = THREE.DoubleSide;
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
      material.dispose(); weave.dispose(); shadowGeometry.dispose(); shadowMaterial.dispose();
      environment.dispose(); light.shadow.map?.dispose(); renderer.dispose();
    },
  };
}
