// Hall plan maths. Pure functions, no AI and no server: everything runs in the browser.
//  - homography / warpQuad: straighten a photographed floor plan (4 corners -> a flat rectangle)
//  - detectCircles: find round tables in a clean, top-down drawing (gradient Hough transform)

// Kinds of items on the plan. Sizes in metres are starting values; the planner can change them.
export const KINDS = {
  round: { label: 'Round table', w: 1.8, h: 1.8, capacity: 8, table: true },
  long: { label: 'Long table', w: 2.4, h: 0.9, capacity: 8, table: true },
  dance: { label: 'Dance floor', w: 6, h: 6 },
  stage: { label: 'Stage', w: 6, h: 3 },
  buffet: { label: 'Buffet / bar', w: 3, h: 0.9 },
};

// Solve A x = b (n x n) with Gaussian elimination and partial pivoting.
function solve(A, b) {
  const n = b.length, M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    if (Math.abs(M[p][c]) < 1e-12) throw new Error('These four corners do not form a usable shape.');
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c] / M[c][c]; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
  }
  return M.map((r, i) => r[n] / r[i]);
}

// Homography H with H * from[i] = to[i] (4 point pairs [x,y]). Returns 9 numbers (h33 = 1).
export function homography(from, to) {
  const A = [], b = [];
  for (let i = 0; i < 4; i++) {
    const [x, y] = from[i], [u, v] = to[i];
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u);
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v);
  }
  return [...solve(A, b), 1];
}
export function applyH(H, x, y) {
  const w = H[6] * x + H[7] * y + H[8];
  return [(H[0] * x + H[1] * y + H[2]) / w, (H[3] * x + H[4] * y + H[5]) / w];
}

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
// Output size for a straightened quad [topLeft, topRight, bottomRight, bottomLeft], longest side <= maxSide.
export function straightSize(quad, maxSide = 1600) {
  const w = (dist(quad[0], quad[1]) + dist(quad[3], quad[2])) / 2, h = (dist(quad[0], quad[3]) + dist(quad[1], quad[2])) / 2;
  const k = Math.min(1, maxSide / Math.max(w, h));
  return [Math.max(1, Math.round(w * k)), Math.max(1, Math.round(h * k))];
}

// Straighten: src RGBA pixels (sw x sh) inside quad -> new RGBA image (ow x oh), bilinear sampling.
export function warpQuad(src, sw, sh, quad, ow, oh) {
  const H = homography([[0, 0], [ow, 0], [ow, oh], [0, oh]], quad); // output pixel -> source pixel
  const out = new Uint8ClampedArray(ow * oh * 4);
  for (let y = 0; y < oh; y++) for (let x = 0; x < ow; x++) {
    const [fx, fy] = applyH(H, x + 0.5, y + 0.5);
    const sx = Math.min(sw - 1.001, Math.max(0, fx - 0.5)), sy = Math.min(sh - 1.001, Math.max(0, fy - 0.5));
    const x0 = sx | 0, y0 = sy | 0, ax = sx - x0, ay = sy - y0, o = (y * ow + x) * 4;
    for (let c = 0; c < 4; c++) {
      const i = (y0 * sw + x0) * 4 + c;
      const top = src[i] * (1 - ax) + src[i + 4] * ax, bottom = src[i + sw * 4] * (1 - ax) + src[i + sw * 4 + 4] * ax;
      out[o + c] = top * (1 - ay) + bottom * ay;
    }
  }
  return out;
}

export function toGray(rgba, w, h) {
  const g = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) g[i] = 0.299 * rgba[i * 4] + 0.587 * rgba[i * 4 + 1] + 0.114 * rgba[i * 4 + 2];
  return g;
}

// Round tables: gradient-directed circular Hough transform.
// gray: Float32Array (w x h). Radii in pixels. Returns [{x, y, r, score}] best first.
// Works best on clean, top-down drawings; photos with shadows, perspective or clutter give fewer or false hits.
export function detectCircles(gray, w, h, rMin, rMax, { minScore = 0.42, max = 60 } = {}) {
  rMin = Math.max(3, Math.round(rMin)); rMax = Math.max(rMin, Math.round(rMax));
  // light blur, then Sobel gradients
  const b = new Float32Array(w * h);
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    let s = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) s += gray[(y + dy) * w + x + dx];
    b[y * w + x] = s / 9;
  }
  const edges = [];
  let sum = 0, sum2 = 0, n = 0;
  const gx = new Float32Array(w * h), gy = new Float32Array(w * h), mag = new Float32Array(w * h);
  for (let y = 2; y < h - 2; y++) for (let x = 2; x < w - 2; x++) {
    const i = y * w + x;
    const X = b[i - w + 1] + 2 * b[i + 1] + b[i + w + 1] - b[i - w - 1] - 2 * b[i - 1] - b[i + w - 1];
    const Y = b[i + w - 1] + 2 * b[i + w] + b[i + w + 1] - b[i - w - 1] - 2 * b[i - w] - b[i - w + 1];
    const m = Math.hypot(X, Y); gx[i] = X; gy[i] = Y; mag[i] = m; sum += m; sum2 += m * m; n++;
  }
  const mean = sum / n, sd = Math.sqrt(Math.max(0, sum2 / n - mean * mean)), thr = Math.max(30, mean + 1.5 * sd);
  for (let y = 2; y < h - 2; y++) for (let x = 2; x < w - 2; x++) { const i = y * w + x; if (mag[i] > thr) edges.push(i); }
  if (edges.length > 400000) return []; // far too busy to be a drawing
  const found = [];
  const acc = new Float32Array(w * h);
  for (let r = rMin; r <= rMax; r++) {
    acc.fill(0);
    for (const i of edges) {
      const x = i % w, y = (i / w) | 0, ux = gx[i] / mag[i], uy = gy[i] / mag[i];
      for (const s of [1, -1]) { // the centre lies along the gradient, on one side or the other
        const cx = Math.round(x + s * r * ux), cy = Math.round(y + s * r * uy);
        if (cx > 0 && cy > 0 && cx < w - 1 && cy < h - 1) acc[cy * w + cx]++;
      }
    }
    const need = minScore * 2 * Math.PI * r;
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      const i = y * w + x; if (acc[i] < need * 0.5) continue;
      // votes in a 3x3 window (rounding spreads them), must be a local maximum
      let v = 0, peak = true;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const a = acc[i + dy * w + dx]; v += a; if (a > acc[i]) peak = false; }
      if (!peak || v < need) continue;
      found.push({ x, y, r, score: v / (2 * Math.PI * r) });
    }
  }
  // keep the strongest; drop overlapping or concentric duplicates
  found.sort((a, b) => b.score - a.score);
  const keep = [];
  for (const c of found) {
    if (keep.some((k) => Math.hypot(k.x - c.x, k.y - c.y) < Math.max(k.r, c.r) * 0.9)) continue;
    keep.push(c); if (keep.length >= max) break;
  }
  return keep;
}

// Seating tables (for the seating plan) from the items on the hall plan.
export const tablesOf = (items) => items.filter((it) => KINDS[it.kind]?.table).map((it) => ({ id: it.id, name: String(it.name || '').trim() || 'Table', capacity: Math.min(50, Math.max(1, Math.round(Number(it.capacity) || 1))) }));

// Bring tables made in the seating plan (without a place on the hall plan) onto the plan, in a row.
export function mergeTables(layout, tables) {
  const items = (layout.items || []).map((it) => { const t = tables.find((x) => x.id === it.id); return t ? { ...it, name: t.name, capacity: t.capacity } : it; })
    .filter((it) => !KINDS[it.kind]?.table || tables.some((t) => t.id === it.id) || it.fresh);
  const ppm = layout.pxPerM || 50, d = KINDS.round.w * ppm;
  let col = 0, row = 0;
  for (const t of tables) if (!items.some((it) => it.id === t.id)) {
    const x = d * (0.9 + col * 1.6), y = d * (0.9 + row * 1.6);
    items.push({ id: t.id, kind: 'round', x, y, w: d, h: d, rot: 0, name: t.name, capacity: t.capacity });
    if (x + d * 2.5 > (layout.w || 2000)) { col = 0; row++; } else col++;
  }
  return { ...layout, items };
}
