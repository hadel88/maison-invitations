import test from 'node:test';
import assert from 'node:assert/strict';
import { envelopeMotion, envelopeVertex, ENVELOPE_END } from '../src/envelopeGL.js';

test('the envelope waits for the seal, then opens the flap before withdrawing', () => {
  assert.deepEqual(envelopeMotion(1), { flap: 0, sides: 0, withdraw: 0 });
  assert.ok(Math.abs(envelopeMotion(3.65).flap - 1) < 1e-10);
  assert.equal(envelopeMotion(3.65).withdraw, 0);
  assert.equal(envelopeMotion(ENVELOPE_END).withdraw, 1);
});
test('all envelope panels leave the invitation clear at the end on phone and desktop layouts', () => {
  for (const [w, h] of [[320, 640], [430, 860]]) for (const part of ['back', 'top', 'bottom', 'left', 'right']) {
    for (const [x, y] of [[0, 0], [w, 0], [w / 2, h / 2], [0, h], [w, h]]) {
      const p = envelopeVertex(x, y, part, ENVELOPE_END, w, h);
      assert.ok(p.every(Number.isFinite));
      assert.ok(p[1] > h, `${part} must finish below the invitation`);
    }
  }
});
