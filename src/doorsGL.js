import * as THREE from 'three';

// Two solid carved doors in real 3D: thick slabs with the carving lit by a normal map made from the
// picture itself, hinged at the outer edges and swinging OUT towards the guest.
// The picture behind (the arch) stays in the page; this canvas is transparent around the doors.

function normalMapFrom(img) {
  const w = img.naturalWidth, h = img.naturalHeight, c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
  const src = ctx.getImageData(0, 0, w, h).data, out = ctx.createImageData(w, h), o = out.data;
  const L = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) L[i] = (src[i * 4] * 0.3 + src[i * 4 + 1] * 0.59 + src[i * 4 + 2] * 0.11) / 255;
  const s = 5.5; // relief strength
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const xl = Math.max(0, x - 1), xr = Math.min(w - 1, x + 1), yu = Math.max(0, y - 1), yd = Math.min(h - 1, y + 1);
    let nx = -(L[y * w + xr] - L[y * w + xl]) * s, ny = (L[yd * w + x] - L[yu * w + x]) * s, nz = 1;
    const k = 1 / Math.hypot(nx, ny, nz); nx *= k; ny *= k; nz *= k;
    const i = (y * w + x) * 4; o[i] = (nx * 0.5 + 0.5) * 255; o[i + 1] = (ny * 0.5 + 0.5) * 255; o[i + 2] = (nz * 0.5 + 0.5) * 255; o[i + 3] = 255;
  }
  ctx.putImageData(out, 0, 0);
  return c;
}

export function createDoors(canvas, { image = '/doors-closed.webp', onReady } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  const scene = new THREE.Scene();
  // the closed doors fill a 2 x 3 frame exactly at distance D
  const D = 4, camera = new THREE.PerspectiveCamera((2 * Math.atan(1.5 / D) * 180) / Math.PI, 2 / 3, 0.05, 50);
  camera.position.set(0, 0, D);

  scene.add(new THREE.AmbientLight(0xfff6e8, 0.78));
  const key = new THREE.DirectionalLight(0xfff3df, 2.6); key.position.set(-1.4, 1.8, 4.5); scene.add(key);
  const fill = new THREE.DirectionalLight(0xffffff, 0.7); fill.position.set(2, -1, 3); scene.add(fill);

  const T = 0.075; // door thickness (the doors are 1 wide, 3 tall)
  const edge = new THREE.MeshStandardMaterial({ color: 0xeee2c9, roughness: 0.55, metalness: 0.05 });
  const leaves = [];
  for (const side of [-1, 1]) {
    const hinge = new THREE.Group(); hinge.position.set(side, 0, 0); scene.add(hinge);
    const face = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.62, metalness: 0 });
    const back = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.62, metalness: 0 });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 3, T), [edge, edge, edge, edge, face, back]);
    mesh.position.set(-side * 0.5, 0, -T / 2);
    hinge.add(mesh); leaves.push({ side, hinge, face, back });
  }

  let disposed = false, ready = false;
  const loader = new THREE.TextureLoader();
  loader.load(image, (tex) => {
    if (disposed) return;
    tex.colorSpace = THREE.SRGBColorSpace;
    const normal = new THREE.CanvasTexture(normalMapFrom(tex.image));
    for (const { side, face, back } of leaves) {
      const half = (t, mirror) => { const c = t.clone(); c.needsUpdate = true; c.repeat.set(mirror ? -0.5 : 0.5, 1); c.offset.set(side < 0 ? (mirror ? 0.5 : 0) : (mirror ? 1 : 0.5), 0); c.wrapS = THREE.RepeatWrapping; return c; };
      face.map = half(tex); face.normalMap = half(normal); face.normalScale = new THREE.Vector2(0.9, 0.9);
      back.map = half(tex); back.normalMap = half(normal);
      face.needsUpdate = back.needsUpdate = true;
    }
    ready = true; draw(); onReady?.();
  });

  let angle = 0, push = 1;
  function resize() {
    const r = canvas.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
    renderer.setPixelRatio(d); renderer.setSize(Math.max(1, r.width), Math.max(1, r.height), false);
  }
  function draw() {
    if (disposed) return;
    for (const { side, hinge } of leaves) hinge.rotation.y = side * angle; // left: -angle, right: +angle → swings out towards the guest
    camera.position.z = D / push;
    renderer.render(scene, camera);
  }
  const ro = new ResizeObserver(() => { resize(); draw(); }); ro.observe(canvas); resize();
  return {
    get ready() { return ready; },
    at(degrees, scale = 1) { angle = (degrees * Math.PI) / 180; push = scale; if (ready) draw(); },
    dispose() { disposed = true; ro.disconnect(); renderer.dispose(); },
  };
}
