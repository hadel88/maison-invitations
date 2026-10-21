import {paperStock,paperRelief,ornamentGlyph,waxStock,invitationScript} from './invitationMaterials';
import {traceSageFlap,sageFlapLift,traceSagePocket} from './sageEnvelopeProfiles.js';
import {paintSageLetter} from './paintSageLetter.js';
import * as THREE from 'three';
import { TessellateModifier } from 'three/addons/modifiers/TessellateModifier.js';

// "A Secret in Sage": a real paper envelope in 3D.
// The embossed green envelope fills the screen; the wax seal sits on the tip of the V flap.
// On touch the flap lifts and folds back on its hinge (bending a little, like paper), the seal
// travels with it, the camera steps back so the opened envelope stays in view, and the
// invitation card slides out of the pocket and comes forward to the guest.
// Light and soft shadows come from one directional light, so flap, seal and card shade
// each other as they move.

// envelope size in world units: portrait on phones, as wide as the screen on tablets and desktops
let W = 0.6; const H = 1;
export const envelopeWidth = (aspect) => Math.max(0.6, aspect * 1.005);
const TOP = H / 2;
// the flap's sides start partway down the envelope, so the V is wide (tip ≈ 100°)
const V_DIP = TOP - 0.3;                   // lowest point of the pocket's V opening
const V_SIDE = TOP - 0.16;           // the pocket edge at the envelope's sides
const FLAP_L = 0.54;                  // hinge → flap tip
const FLAP_SIDE = 0.3;                // hinge → where the flap's sides turn to the tip
const FLAP_MID = (FLAP_SIDE + FLAP_L) / 2 + 0.012; // a gentle outward curve along each edge
const SEAL = 0.19;                    // seal diameter
const CARD_W = 0.38, CARD_H = CARD_W * 1.6, CARD_T = 0.0025;
const CARD_HIDDEN_Y = V_DIP - 0.012 - CARD_H / 2;
// the card's bottom corners must clear the pocket's edge before it comes forward
const CARD_RISEN_Y = V_DIP + (V_SIDE - V_DIP) * (CARD_W / W) + 0.012 + CARD_H / 2;
const FOV = 32, TAN = Math.tan(THREE.MathUtils.degToRad(FOV / 2));

// timeline (seconds)
export const SAGE_TIMES = { press: [0, 0.45], flap: [0.3, 2.35], camera: [1.45, 3.8], rise: [2.35, 4.45], forward: [4.25, 6.05], withdraw: [6.25, 7.65], done: 7.65 };

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const span = (t, [a, b]) => clamp01((t - a) / (b - a));
const inOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const sine = (x) => -(Math.cos(Math.PI * x) - 1) / 2;
const outCubic = (x) => 1 - Math.pow(1 - x, 3);
const mix = (a, b, x) => a + (b - a) * x;

function loadImage(src) {
  return new Promise((ok, no) => { const i = new Image(); i.decoding = 'async'; i.onload = () => ok(i); i.onerror = no; i.src = src; });
}
// the script font for "You are invited" ships with the site (Great Vibes, OFL)
async function loadScript() { await invitationScript();await document.fonts.load('52px "Great Vibes"'); }
function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

// envelope coordinates (x ∈ [-W/2, W/2], y ∈ [-H/2, H/2]) → texture canvas pixels
function toPx(c, x, y) { return [(x / W + 0.5) * c.width, (0.5 - y / H) * c.height]; }
// the cover photo is a little narrower than the envelope: use its full width, crop height
// one photo width = 0.6 world units; on a wider envelope the paper repeats, mirrored, so it stays seamless
function drawPaper(g, img, c) { g.drawImage(img,0,0,c.width,c.height); }
const texW = (base) => Math.min(base * 2.5, Math.round(base * W / 0.6));

function flapPath(g, c, ox = 0, oy = 0, layout='arch') {
  const scale=c.width/W;g.beginPath();g.save();g.translate(...toPx(c,ox,TOP+oy));g.scale(scale,-scale);traceSageFlap(g,W,FLAP_L,layout);g.restore();
}

// green embossed paper for the outside, with the seams of a folded envelope
function outsideTextures(img, guestLine, family, inviteLine, script, design={}) {
  const c = canvas(texW(1024), Math.round(texW(1024) * H / W));
  const pocket = canvas(c.width, c.height), flap = canvas(c.width, c.height);
  let g = pocket.getContext('2d');
  drawPaper(g, img, pocket);
  if (inviteLine) { // pressed into the paper in dark ink, like a letterpress line
    g.save(); g.textAlign = 'center'; g.textBaseline = 'middle';
    const [x, y] = toPx(pocket, 0, -0.19), px = pocket.width / W;
    let size = 0.052 * px; g.font = `${size}px ${script}`;
    while (g.measureText(inviteLine).width > 0.4 * px && size > 20) { size -= 2; g.font = `${size}px ${script}`; }

    g.fillStyle=design.ink||'#46513e';
    g.fillText(inviteLine, x, y);
    g.restore();
  }
  if (guestLine) {
    g.save(); g.textAlign = 'center'; g.textBaseline = 'middle';
    const [x, y] = toPx(pocket, 0, -0.29);
    g.font = `italic 400 64px ${family}`;
    g.fillStyle = 'rgba(16,20,12,.35)'; g.fillText(guestLine, x + 1.5, y + 2.5);
    const gold = g.createLinearGradient(x - 220, y - 40, x + 220, y + 40);
    gold.addColorStop(0, '#b89a5c'); gold.addColorStop(0.45, '#ecd9a4'); gold.addColorStop(0.55, '#d8bd7f'); gold.addColorStop(1, '#a8874a');
    g.fillStyle = gold; g.fillText(guestLine, x, y); g.restore();
  }
  if(!guestLine){g.save();g.fillStyle=design.ink||'#46513e';g.textAlign='center';g.font=`${pocket.width*.05}px Georgia`;g.fillText(ornamentGlyph(design.ornament),...toPx(pocket,0,-.302));g.restore();}
  g = flap.getContext('2d');
  drawPaper(g, img, flap);
  flapPath(g,flap,0,0,design.pageLayout);g.save();g.clip();g.strokeStyle='#ede8cfbb';g.lineWidth=flap.width*14/600;g.stroke();g.restore();
  return { pocket, flap };
}

// the liner: the same emboss turned into ivory paper
function linerTexture(img) {
  const c = canvas(texW(512), Math.round(texW(512) * H / W)), g = c.getContext('2d');
  drawPaper(g, img, c);
  const d = g.getImageData(0, 0, c.width, c.height), p = d.data;
  let sum = 0; for (let i = 0; i < p.length; i += 4) sum += p[i] * 0.3 + p[i + 1] * 0.59 + p[i + 2] * 0.11;
  const mean = sum / (p.length / 4);
  for (let i = 0; i < p.length; i += 4) {
    const l = (p[i] * 0.3 + p[i + 1] * 0.59 + p[i + 2] * 0.11 - mean) / 60;
    const k = 0.93 + 0.11 * Math.max(-1.4, Math.min(1.4, l));
    p[i] = Math.min(255, 240 * k); p[i + 1] = Math.min(255, 233 * k); p[i + 2] = Math.min(255, 214 * k);
  }
  g.putImageData(d, 0, 0);
  return c;
}

// the gummed strip along the inside of the flap's V edges: the sticky part that held it closed
function gumPath(g, c, inset, layout='arch') {
  g.beginPath();g.save();g.translate(...toPx(c,0,TOP));g.scale(c.width/W,-c.width/W);traceSageFlap(g,W-inset*2,FLAP_L-inset,layout);g.restore();
}
function flapLinerTextures(linerCanvas,design={}) {
  const c = canvas(linerCanvas.width, linerCanvas.height), g = c.getContext('2d');
  g.drawImage(linerCanvas, 0, 0);
  g.fillStyle = 'rgba(70,60,40,.05)'; g.fillRect(0, 0, c.width, c.height);
  const px = c.width / W, band = 0.042 * px;
  g.save(); flapPath(g, c,0,0,design.pageLayout); g.clip();
  g.lineJoin = 'round'; g.lineCap = 'round';
  // the dried glue: a slightly amber, glassy band with a soft inner edge
  g.strokeStyle = 'rgba(200,170,105,.42)'; g.lineWidth = band; gumPath(g, c, 0.021, design.pageLayout); g.stroke();
  g.strokeStyle = 'rgba(178,146,86,.22)'; g.lineWidth = band * 0.55; gumPath(g, c, 0.017, design.pageLayout); g.stroke();
  g.strokeStyle = 'rgba(255,250,232,.5)'; g.lineWidth = Math.max(1.5, 0.003 * px); gumPath(g, c, 0.04, design.pageLayout); g.stroke();
  g.strokeStyle = 'rgba(120,98,58,.28)'; g.lineWidth = Math.max(1, 0.002 * px); gumPath(g, c, 0.043, design.pageLayout); g.stroke();
  g.restore();
  // a top fold crease where the flap meets the envelope
  const [, y] = toPx(c, 0, TOP - 0.004);
  const cr = g.createLinearGradient(0, y - 6, 0, y + 10); cr.addColorStop(0, 'rgba(90,76,50,.25)'); cr.addColorStop(1, 'rgba(90,76,50,0)');
  g.fillStyle = cr; g.fillRect(0, y - 6, c.width, 16);
  // roughness: the gum is shinier than the paper (green channel = roughness)
  const r = canvas(Math.round(c.width / 2), Math.round(c.height / 2)), q = r.getContext('2d');
  q.fillStyle = 'rgb(240,240,240)'; q.fillRect(0, 0, r.width, r.height);
  q.save(); flapPath(q, r,0,0,design.pageLayout); q.clip(); q.lineJoin = 'round'; q.strokeStyle = 'rgb(95,95,95)'; q.lineWidth = band / 2; gumPath(q, r, 0.021,design.pageLayout); q.stroke(); q.restore();
  return { color: c, rough: r };
}

// the invitation card with the couple's words
export async function drawSageCard(card) {
  const fam = card.font || "'Cormorant Garamond', Georgia, serif";
  const serif = "'Cormorant Garamond', Georgia, serif";
  try { await Promise.all([document.fonts.load(`italic 400 120px ${fam}`, card.names), document.fonts.load(`italic 400 40px ${serif}`), document.fonts.load(`500 26px ${serif}`)]); } catch { /* system font */ }
  const c = canvas(1024, Math.round(1024 * 1.6)), g = c.getContext('2d'), w = c.width, h = c.height, cx = w / 2;
  const paper = g.createLinearGradient(0, 0, w, h);
  const design=card.design||{};
  const layout=design.pageLayout||'arch';
  // The sheet itself has a category-specific cut, not a rectangular colour overlay.
  g.beginPath();
  if(layout==='diamond'){g.moveTo(w/2,12);g.lineTo(w-16,170);g.lineTo(w-16,h-170);g.lineTo(w/2,h-12);g.lineTo(16,h-170);g.lineTo(16,170);g.closePath();}
  else if(layout==='cameo'){g.ellipse(w/2,h/2,w*.485,h*.49,0,0,Math.PI*2);}
  else if(layout==='ticket'){g.roundRect(12,12,w-24,h-24,20);}
  else if(layout==='chapel'||layout==='arch'){g.moveTo(12,h-12);g.lineTo(12,300);g.bezierCurveTo(12,-80,w-12,-80,w-12,300);g.lineTo(w-12,h-12);g.closePath();}
  else g.roundRect(12,12,w-24,h-24,layout==='cloud'?180:layout==='menu'?70:4);
  g.clip();
  paper.addColorStop(0, '#fffdf7'); paper.addColorStop(0.55, design.paper||'#f4efe2'); paper.addColorStop(1, design.paper||'#ece5d3');
  g.globalAlpha=.95; g.fillStyle = paper; g.fillRect(0, 0, w, h); g.globalAlpha=1;
  // cotton grain
  const n = g.getImageData(0, 0, w, h), p = n.data;
  for (let i = 0; i < p.length; i += 4) { const r = (Math.random() - 0.5) * 7; p[i] += r; p[i + 1] += r; p[i + 2] += r; }
  g.putImageData(n, 0, 0);
  if(paintSageLetter(g,w,h,card,design))return c;
  const gold = (y0, y1) => { const gr = g.createLinearGradient(0, y0, w, y1); gr.addColorStop(0, design.color||'#a78b52'); gr.addColorStop(0.5, '#d8c08a'); gr.addColorStop(1, '#9c8049'); return gr; };
  g.strokeStyle = gold(0, h); g.lineWidth = 3; g.beginPath();g.roundRect(46,46,w-92,h-92,(design.radius||0)*2);g.stroke();
  g.lineWidth = 1.2; g.beginPath();g.roundRect(62,62,w-124,h-124,(design.radius||0)*1.8);g.stroke();
  // little sprigs in the corners
  g.fillStyle = design.color||'#a99563';
  g.textAlign='center';g.font='46px Georgia';g.fillText(ornamentGlyph(design.ornament),cx,150);
  for (const [x, y] of [[62, 62], [w - 62, 62], [62, h - 62], [w - 62, h - 62]]) { g.beginPath(); g.arc(x, y, 6, 0, Math.PI * 2); g.fill(); }
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const ink = design.ink||'#46513e';
  g.fillStyle = '#8f7c4f'; g.font = `500 31px ${serif}`; g.letterSpacing = '7px';
  g.fillText(card.overline, cx, 260, w - 200); g.letterSpacing = '0px';
  g.fillStyle = gold(150, 270); g.fillRect(cx - 45, 312, 90, 2);
  const fit = (txt, size, max) => { let s = size; do { g.font = `italic 400 ${s}px ${fam}`; s -= 4; } while (g.measureText(txt).width > max && s > 40); };
  g.fillStyle = ink;
  if(layout==='editorial'||layout==='diploma'){
    g.fillStyle=design.color;g.fillRect(90,370,12,480);
    g.textAlign='left';fit(card.names,layout==='editorial'?128:144,w-260);g.fillText(card.names,140,620,w-260);g.textAlign='center';
  }
  const names = card.names.split(/\s*&\s*/);
  if(layout==='editorial'||layout==='diploma'){ /* heading is in the editorial column above */ }
  else if (names.length > 1) {
    fit(names[0], 158, w - 190); g.fillText(names[0], cx, 510);
    g.fillStyle = '#a99563'; g.font = `italic 400 84px ${serif}`; g.fillText('&', cx, 645);
    g.fillStyle = ink; fit(names[1], 158, w - 190); g.fillText(names[1], cx, 780);
  } else { fit(card.names, 158, w - 190); g.fillText(card.names, cx, 640); }
  g.fillStyle = ink; g.font = `italic 400 46px ${serif}`;
  const words = card.subtitle.split(' '); let lineTxt = '', lines = [];
  for (const wd of words) { const t = lineTxt ? lineTxt + ' ' + wd : wd; if (g.measureText(t).width > w - 260 && lineTxt) { lines.push(lineTxt); lineTxt = wd; } else lineTxt = t; }
  if (lineTxt) lines.push(lineTxt); lines = lines.slice(0, 3);
  lines.forEach((l, i) => g.fillText(l, cx, 960 + i * 60));
  const y = 960 + lines.length * 60 + 55;
  g.fillStyle = gold(y, y); g.fillRect(cx - 100, y, 200, 1.8);
  g.fillStyle = '#5c624c'; g.font = `500 36px ${serif}`; g.letterSpacing = '5px';
  g.fillText(card.date.toUpperCase(), cx, y + 85, w - 180); g.letterSpacing = '0px';
  g.fillStyle = ink; g.font = `italic 400 54px ${serif}`; g.fillText(card.venue || '', cx, y + 175, w - 180);
  if(layout==='ticket'){g.setLineDash([12,14]);g.strokeStyle=design.color;g.beginPath();g.moveTo(50,1350);g.lineTo(w-50,1350);g.stroke();g.setLineDash([]);}
  if(layout==='festive'||layout==='cloud'){g.fillStyle=design.color;g.font='70px Georgia';for(const x of [140,w-140])g.fillText(ornamentGlyph(design.ornament),x,500);}
  return c;
}

export function createSageEnvelope(canvasEl, { card, guestLine, inviteLine, onSeal, onShape, design = {} }) {
  { const r0 = canvasEl.getBoundingClientRect(); if (r0.width && r0.height) W = envelopeWidth(r0.width / r0.height); }
  const builtW = W;
  const renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.01, 20);

  scene.add(new THREE.HemisphereLight(0xfff6e6, 0x7d8466, 1.9));
  const sun = new THREE.DirectionalLight(0xfff3dc, 2.3);
  sun.position.set(-0.55, 1.35, 2.2); sun.target.position.set(0, 0.35, 0);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -(W / 2 + 0.6), right: W / 2 + 0.6, top: 1.3, bottom: -1.0, near: 0.5, far: 5 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.002; sun.shadow.radius = 5; sun.shadow.blurSamples = 16;
  scene.add(sun, sun.target);

  const tex = (src, aniso = true) => {
    const t = new THREE.CanvasTexture(src); t.colorSpace = THREE.SRGBColorSpace;
    if (aniso) t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return t;
  };
  const paperMat = (map, bump) => new THREE.MeshStandardMaterial({ map, bumpMap: bump, bumpScale: 0.9, roughness: 0.88, metalness: 0 });
  const envUV = (geo, oy = 0) => { // uv from envelope coordinates
    const pos = geo.attributes.position, uv = new Float32Array(pos.count * 2);
    for (let i = 0; i < pos.count; i++) { uv[i * 2] = pos.getX(i) / W + 0.5; uv[i * 2 + 1] = (pos.getY(i) + oy) / H + 0.5; }
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    return geo;
  };

  const env = new THREE.Group(); scene.add(env);
  // Withdraw the paper shell only after the original card movement has settled.
  const shell = new THREE.Group(); env.add(shell);
  // a soft shadow under the envelope, so it lies in the scene instead of floating
  { const c = canvas(256, Math.round(256 * H / W)), g = c.getContext('2d');
    g.filter = 'blur(14px)'; g.fillStyle = 'rgba(14,18,10,.55)'; g.fillRect(26, 26, c.width - 52, c.height - 52);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(W * 1.16, H * 1.16), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
    m.position.set(0.006, -0.014, -0.004); shell.add(m); }
  // back panel (its inside is the liner)
  const back = new THREE.Mesh(envUV(new THREE.PlaneGeometry(W, H)), new THREE.MeshStandardMaterial({ color: 0xf1ebda, roughness: 0.92 }));
  back.receiveShadow = true; shell.add(back);
  // pocket: the front of the envelope below the V opening
  const pocketShape = new THREE.Shape();
  traceSagePocket(pocketShape,W,H,V_SIDE,V_DIP,design.pageLayout);
  const pocket = new THREE.Mesh(envUV(new THREE.ShapeGeometry(pocketShape, 24)), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped:false }));
  pocket.position.z = 0.009; pocket.castShadow = true; pocket.receiveShadow = true; shell.add(pocket);

  // flap, hinged at the top edge. Tessellated so it can bend like paper.
  const flapShape = new THREE.Shape();
  traceSageFlap(flapShape,W,FLAP_L,design.pageLayout);
  let flapGeo = new THREE.ShapeGeometry(flapShape, 20);
  flapGeo = new TessellateModifier(0.035, 8).modify(flapGeo);
  envUV(flapGeo, TOP);
  const flapPositions=flapGeo.attributes.position;
  for(let i=0;i<flapPositions.count;i++)flapPositions.setZ(i,sageFlapLift(flapPositions.getY(i),FLAP_L));
  flapGeo.computeVertexNormals();
  const flapRest = Float32Array.from(flapGeo.attributes.position.array);
  const hinge = new THREE.Group(); hinge.position.set(0, TOP, 0.0005); shell.add(hinge);
  const flapFront = new THREE.Mesh(flapGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped:false, side: THREE.FrontSide, shadowSide: THREE.DoubleSide }));
  const flapBack = new THREE.Mesh(flapGeo, new THREE.MeshStandardMaterial({ color: 0xf1ebda, roughness: 0.92, side: THREE.BackSide, name: 'flapLiner' }));
  flapFront.castShadow = true; flapFront.receiveShadow = true; flapBack.receiveShadow = true;
  const flap = new THREE.Group(); flap.add(flapFront, flapBack); hinge.add(flap);

  // the wax seal: a few stacked layers give it body when it tilts
  const seal = new THREE.Group(); flap.add(seal);
  const sealGeo = new THREE.PlaneGeometry(SEAL * 1312 / 1199, SEAL);
  const sealLayers = [0.55, 0.62, 0.72, 1].map((shade, i) => {
    // Preserve the photographed wax impression on the face; shaded edge layers supply its depth.
    const material=i===3
      ? new THREE.MeshBasicMaterial({color:0xffffff,alphaTest:.5,toneMapped:false})
      : new THREE.MeshPhysicalMaterial({ color: new THREE.Color(shade, shade, shade), transparent: false, alphaTest: 0.5, roughness: .48, metalness: 0, clearcoat: .18, clearcoatRoughness: .38 });
    const m = new THREE.Mesh(sealGeo, material);
    m.position.z = 0.0018 * (i + 1); m.castShadow = true; seal.add(m); return m;
  });
  const SEAL_Y = -FLAP_L + SEAL * 0.36;

  // the card
  // Printed ink keeps its intended contrast; only the paper edge takes scene lighting.
  const cardMats = [0, 1, 2, 3, 4, 5].map((i) => i===4
    ? new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,depthWrite:true})
    : new THREE.MeshStandardMaterial({color:0xf3eedf,roughness:.88,transparent:false,depthWrite:true}));
  // Die-cut paper has a physical edge and casts its own silhouette, rather than a box behind a transparent image.
  const paperShape = new THREE.Shape(), layout=design.pageLayout||'arch', x=CARD_W/2, y=CARD_H/2;
  if(layout==='cameo')paperShape.absellipse(0,0,x*.98,y*.98,0,Math.PI*2,false,0);
  else if(['arch','chapel','cloud'].includes(layout)){
    const rise=layout==='cloud'?y*.6:y*.72;
    paperShape.moveTo(-x,-y);paperShape.lineTo(x,-y);paperShape.lineTo(x,rise);
    paperShape.bezierCurveTo(x,y*1.14,-x,y*1.14,-x,rise);paperShape.closePath();
  }else if(layout==='diamond'){
    paperShape.moveTo(0,y);paperShape.lineTo(x,y*.78);paperShape.lineTo(x,-y*.78);paperShape.lineTo(0,-y);paperShape.lineTo(-x,-y*.78);paperShape.lineTo(-x,y*.78);paperShape.closePath();
  }else if(layout==='ticket'){
    const notch=CARD_W*.045,cut=-y*.65;
    paperShape.moveTo(-x,-y);paperShape.lineTo(x,-y);paperShape.lineTo(x,cut-notch);paperShape.absarc(x,cut,notch,-Math.PI/2,-Math.PI*1.5,true);paperShape.lineTo(x,y);paperShape.lineTo(-x,y);paperShape.lineTo(-x,cut+notch);paperShape.absarc(-x,cut,notch,Math.PI/2,-Math.PI/2,true);paperShape.closePath();
  }else{paperShape.moveTo(-x,-y);paperShape.lineTo(x,-y);paperShape.lineTo(x,y);paperShape.lineTo(-x,y);paperShape.closePath();}
  const paperGeo=new THREE.ExtrudeGeometry(paperShape,{depth:CARD_T,bevelEnabled:false,curveSegments:48});paperGeo.translate(0,0,-CARD_T/2);
  const paperPos=paperGeo.attributes.position,paperUV=paperGeo.attributes.uv;
  for(let i=0;i<paperPos.count;i++)paperUV.setXY(i,paperPos.getX(i)/CARD_W+.5,paperPos.getY(i)/CARD_H+.5);
  paperGeo.groups.forEach(group=>{group.materialIndex=group.materialIndex===0?4:0});
  const cardMesh = new THREE.Mesh(paperGeo, cardMats);
  cardMesh.castShadow = true; cardMesh.receiveShadow = true;
  const cardGroup = new THREE.Group(); cardGroup.add(cardMesh); cardGroup.scale.setScalar(.78); env.add(cardGroup);

  // views: closed (envelope fills the screen), opened (envelope low, room for the card) and the card in front
  let aspect = 1, cssW = 1, cssH = 1;
  function views() {
    // closed, the envelope fills the whole screen
    const vh0 = Math.min(H, W / aspect) * 0.985;
    const c0 = 0;
    // no zoom-out while opening: the camera only glides up with the card, so everything stays big
    const vh1 = vh0;
    const c1 = CARD_RISEN_Y + CARD_H / 2 + 0.05 * vh1 - vh1 / 2;
    const vhz = Math.min(Math.max(CARD_W / (0.97 * aspect), CARD_H / 0.9), vh1 * 0.9); // always in front of the envelope
    return { vh0, c0, vh1, c1, vhz };
  }
  let cardLoaded = false;
  function pose(t) {
    const v = views();
    const withdrawal = inOut(span(t, SAGE_TIMES.withdraw));
    shell.position.y = -2.5 * withdrawal;
    shell.visible = withdrawal < 1;
    // seal press and the flap's journey
    const press = span(t, SAGE_TIMES.press);
    const f = span(t, SAGE_TIMES.flap);
    const lift = Math.sin(press * Math.PI) * 0.06;
    const angle = THREE.MathUtils.degToRad(mix(0, 186, inOut(f)) + lift * 40 * (1 - f));
    hinge.rotation.x = -angle;
    // paper bends while it moves: the tip lags behind
    const bend = Math.sin(f * Math.PI) * 0.075 + lift * 0.4;
    const pos = flapGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = flapRest[i * 3 + 1] / FLAP_L; // 0 … -1
      pos.setZ(i, flapRest[i * 3 + 2] - bend * y * y * FLAP_L * 0.55);
    }
    pos.needsUpdate = true; flapGeo.computeVertexNormals();
    const ty = SEAL_Y / FLAP_L, tz = sageFlapLift(SEAL_Y,FLAP_L) - bend * ty * ty * FLAP_L * 0.55, slope = -.025/FLAP_L - bend * 2 * ty * 0.55;
    seal.position.set(0, SEAL_Y, tz); seal.rotation.x = Math.atan(slope);
    const s = 1 - Math.sin(press * Math.PI) * 0.035; seal.scale.set(s, s, 1);
    // camera steps back
    const k = sine(span(t, SAGE_TIMES.camera));
    const vh = mix(v.vh0, v.vh1, k), cy = mix(v.c0, v.c1, k);
    camera.position.set(0, cy, vh / (2 * TAN)); camera.lookAt(0, cy, 0);
    // the card rises out of the pocket, then comes forward
    const r = span(t, SAGE_TIMES.rise), fw = span(t, SAGE_TIMES.forward);
    const ry = mix(CARD_HIDDEN_Y, CARD_RISEN_Y, inOut(r));
    const d1 = v.vh1 / (2 * TAN), zc = d1 - v.vhz / (2 * TAN);
    const fz = outCubic(clamp01(fw * 1.35)), fy = inOut(fw);
    cardGroup.position.set(0, mix(ry, v.c1 + 0.04 * v.vhz, fy), mix(0.0045, zc, fz) + Math.sin(fw * Math.PI) * 0.05);
    cardGroup.rotation.set(Math.sin(fw * Math.PI) * -0.16, 0, Math.sin(fw * Math.PI) * 0.035 + Math.sin(r * Math.PI) * 0.012);
    cardGroup.visible = cardLoaded && t >= SAGE_TIMES.flap[0];
    // the light softens on the envelope once the card is presented
    sun.intensity = mix(2.3, 2.0, fy);
  }

  function seal2D() {
    const p = new THREE.Vector3(); seal.getWorldPosition(p); p.project(camera);
    const top = new THREE.Vector3(0, SEAL / 2, 0); seal.localToWorld(top); top.project(camera);
    return { x: (p.x + 1) / 2 * cssW, y: (1 - p.y) / 2 * cssH, r: Math.abs(top.y - p.y) / 2 * cssH };
  }

  let t = 0, start = 0, raf = 0, playing = false, onDone = null, dead = false;
  function render() { pose(t); renderer.render(scene, camera); }
  function resize() {
    const r = canvasEl.getBoundingClientRect();
    if (!r.width || !r.height) return;
    cssW = r.width; cssH = r.height; aspect = r.width / r.height;
    renderer.setPixelRatio(Math.min(2.5, Math.max(1.5, window.devicePixelRatio || 1)));
    renderer.setSize(r.width, r.height, false);
    camera.aspect = aspect; camera.updateProjectionMatrix();
    render();
    if (t === 0) onSeal?.(seal2D());
    if (Math.abs(envelopeWidth(aspect) - builtW) / builtW > 0.06) onShape?.();
  }
  const ro = new ResizeObserver(resize); ro.observe(canvasEl);

  function frame(now) {
    if (!playing || dead) return;
    if (!start) start = now - t * 1000;
    t = (now - start) / 1000;
    if (t >= SAGE_TIMES.done) { t = SAGE_TIMES.done; playing = false; render(); onDone?.(); return; }
    render();
    raf = requestAnimationFrame(frame);
  }

  // textures
  const ready = (async () => {
    const [coverImage, wax] = await Promise.all([loadImage(`/${design.materialCover || 'atelier-sage-cover'}.webp`), loadImage('/maison-wax-seal.png')]);
    if (dead) return;
    const cover=paperStock(coverImage,design);
    const family = "'Cormorant Garamond', Georgia, serif";
    if (guestLine) { try { await document.fonts.load(`italic 400 64px ${family}`); } catch { /* system font */ } }
    const script = "'Great Vibes', 'Parisienne', cursive";
    if (inviteLine) await loadScript();
    const { pocket: pc, flap: fc } = outsideTextures(cover, guestLine, family, inviteLine, script, design);
    const linerCanvas = linerTexture(cover), liner = tex(linerCanvas);
    const gum = flapLinerTextures(linerCanvas,design), gumTex = tex(gum.color), gumRough = new THREE.CanvasTexture(gum.rough);
    for (const [m, map] of [[pocket.material, tex(pc)], [flapFront.material, tex(fc)]]) { m.map = map; m.color.set(0xffffff); m.needsUpdate = true; }
    back.material.map = liner; back.material.bumpMap = liner; back.material.bumpScale = .007; back.material.color.set(0xffffff); back.material.needsUpdate = true;
    Object.assign(flapBack.material, { map: gumTex, bumpMap: gumTex, bumpScale: .007, roughnessMap: gumRough, roughness: 1 }); flapBack.material.color.set(0xf4eee0); flapBack.material.needsUpdate = true;
    const waxCanvas=waxStock(wax,design);

    const waxTex = tex(waxCanvas),waxBump=new THREE.CanvasTexture(paperRelief(waxCanvas));
    sealLayers.forEach((m) => { m.material.map = waxTex; if(!m.material.isMeshBasicMaterial){m.material.bumpMap = waxBump; m.material.bumpScale = .002;} m.material.needsUpdate = true; });
    const cardCanvas = await drawSageCard(card);
    if (dead) return;
    cardMats[4].map = tex(cardCanvas); cardMats[4].needsUpdate = true;
    cardLoaded = true;
    resize();
  })();

  if (import.meta.env?.DEV) window.__sageSeek = (s) => { playing = false; cancelAnimationFrame(raf); t = s; render(); };
  return {
    ready,
    play(done) { onDone = done; if (playing) return; playing = true; start = 0; raf = requestAnimationFrame(frame); },
    reset() { playing = false; cancelAnimationFrame(raf); t = 0; render(); onSeal?.(seal2D()); },
    finish() { playing = false; cancelAnimationFrame(raf); t = SAGE_TIMES.done; render(); },
    seek(s) { playing = false; cancelAnimationFrame(raf); t = s; render(); },
    async setCard(next) { const c = await drawSageCard(next); if (dead) return; cardMats[4].map?.dispose(); cardMats[4].map = tex(c); cardMats[4].needsUpdate = true; render(); },
    destroy() { dead = true; playing = false; cancelAnimationFrame(raf); ro.disconnect(); renderer.dispose(); renderer.forceContextLoss?.(); },
  };
}
