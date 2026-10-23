import test from 'node:test';
import assert from 'node:assert/strict';
import { homography, applyH, warpQuad, straightSize, detectCircles, tablesOf, mergeTables } from '../src/hallPlan.js';

// a white "drawing" with black outlines
function canvas(w, h) { const g = new Float32Array(w * h).fill(250); return g; }
function ring(g, w, cx, cy, r, t = 2) { for (let y = 0; y < g.length / w; y++) for (let x = 0; x < w; x++) { const d = Math.hypot(x - cx, y - cy); if (Math.abs(d - r) <= t / 2) g[y * w + x] = 20; } }
function rect(g, w, x0, y0, x1, y1) { for (let x = x0; x <= x1; x++) { g[y0 * w + x] = 20; g[y1 * w + x] = 20; } for (let y = y0; y <= y1; y++) { g[y * w + x0] = 20; g[y * w + x1] = 20; } }

test('homography maps the four corners exactly', () => {
  const from = [[0, 0], [100, 0], [100, 50], [0, 50]], to = [[10, 5], [210, 30], [190, 140], [5, 120]];
  const H = homography(from, to);
  from.forEach((p, i) => { const [u, v] = applyH(H, ...p); assert.ok(Math.abs(u - to[i][0]) < 1e-6 && Math.abs(v - to[i][1]) < 1e-6); });
});

test('straighten keeps a pixel inside the quad where it belongs', () => {
  const sw = 40, sh = 40, src = new Uint8ClampedArray(sw * sh * 4).fill(255);
  for (let y = 10; y < 30; y++) for (let x = 10; x < 30; x++) { const i = (y * sw + x) * 4; src[i] = 0; } // red channel 0 in the middle
  const out = warpQuad(src, sw, sh, [[10, 10], [30, 10], [30, 30], [10, 30]], 20, 20);
  assert.equal(out[(10 * 20 + 10) * 4], 0);
  assert.deepEqual(straightSize([[0, 0], [3000, 0], [3000, 1500], [0, 1500]]), [1600, 800]);
});

test('finds round tables in a clean floor plan and ignores rectangles and walls', () => {
  const w = 400, h = 260, g = canvas(w, h);
  rect(g, w, 5, 5, 394, 254); // walls
  rect(g, w, 150, 20, 250, 60); // stage
  const tables = [[60, 120, 18], [120, 120, 18], [180, 120, 18], [60, 200, 18], [120, 200, 18], [300, 180, 22]];
  for (const [x, y, r] of tables) ring(g, w, x, y, r);
  const found = detectCircles(g, w, h, 12, 28);
  for (const [x, y, r] of tables) assert.ok(found.some((c) => Math.hypot(c.x - x, c.y - y) <= 3 && Math.abs(c.r - r) <= 3), `table at ${x},${y} found`);
  assert.equal(found.length, tables.length, JSON.stringify(found));
});

test('a blank page has no tables', () => {
  const w = 200, h = 150; assert.equal(detectCircles(canvas(w, h), w, h, 8, 30).length, 0);
});

test('seating tables come from round and long tables only; seating-tab tables appear on the plan', () => {
  const items = [{ id: 'a', kind: 'round', name: ' Rose ', capacity: 10 }, { id: 'b', kind: 'dance' }, { id: 'c', kind: 'long', name: '', capacity: 99 }];
  assert.deepEqual(tablesOf(items), [{ id: 'a', name: 'Rose', capacity: 10 }, { id: 'c', name: 'Table', capacity: 50 }]);
  const merged = mergeTables({ w: 2000, pxPerM: 50, items }, [{ id: 'a', name: 'Rose garden', capacity: 8 }, { id: 'n', name: 'Table 9', capacity: 6 }]);
  assert.equal(merged.items.find((i) => i.id === 'a').name, 'Rose garden');
  assert.ok(merged.items.find((i) => i.id === 'n'));
  assert.ok(!merged.items.find((i) => i.id === 'c'), 'a table removed in the seating tab leaves the plan');
  assert.ok(merged.items.find((i) => i.id === 'b'), 'dance floor stays');
});
