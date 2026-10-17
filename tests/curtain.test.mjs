import test from 'node:test';
import assert from 'node:assert/strict';
import { curtainPoint, CURTAIN_END } from '../src/curtainGL.js';

test('curtain leaves meet along the entire closed seam before the pull begins', () => {
  for (const width of [320, 412, 1360]) for (const v of [0, .25, .5, .75, 1]) {
    const left = curtainPoint(1, v, -1, 3.3, width, 850);
    const right = curtainPoint(1, v, 1, 3.3, width, 850);
    assert.ok(Math.abs(left[0] - right[0]) < .001);
    assert.ok(Math.abs(left[0] - width / 2) < .001);
  }
});

test('gathered fabric clears the text, remains finite, and settles without a position jump', () => {
  for (const side of [-1, 1]) for (const u of [0, .2, .5, .9, 1]) for (const v of [0, .3, .7, 1]) {
    for (const t of [0, 3.3, 4, 5, 7, CURTAIN_END]) assert.ok(curtainPoint(u, v, side, t, 412, 550).every(Number.isFinite));
    const a = curtainPoint(u, v, side, CURTAIN_END, 412, 550);
    const b = curtainPoint(u, v, side, CURTAIN_END + .1, 412, 550);
    assert.deepEqual(a, b);
  }
  const edge = curtainPoint(1, .5, -1, CURTAIN_END, 412, 550);
  assert.ok(edge[0] < 412 * .12);
});
