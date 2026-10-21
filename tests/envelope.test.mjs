import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const cinema = readFileSync(new URL('../src/Cinema.jsx', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../src/atelier.css', import.meta.url), 'utf8');

test('Sage cover is a real layered envelope with the wax attached to its flap', () => {
  const flapMarkup = cinema.match(/<div className="sage-envelope-flap">([\s\S]*?)<\/div>\s*<div className="sage-envelope-print">/);
  assert.ok(flapMarkup, 'the envelope flap should have its own layer');
  assert.match(flapMarkup[1], /className="sage-envelope-lining"/);
  assert.match(flapMarkup[1], /className="sage-wax-release"/);
  assert.match(flapMarkup[1], /maison-wax-seal\.png/);
  assert.match(styles, /clip-path:\s*polygon\(0 0, 100% 0, 100% 63\.9%, 50% 100%, 0 63\.9%\)/);
  assert.match(styles, /\.atelier-opening \.sage-envelope-flap\s*\{[^}]*rotateX\(176deg\)/s);
});

test('the invitation stays hidden until the seal opens the flap, then rises as opaque paper', () => {
  assert.match(cinema, /setTimeout\(\(\)=>onComplete\(true\),reduced\?0:2850\)/);
  assert.match(styles, /\.atelier-sage\.atelier-opening \.atelier-inscription\s*\{\s*visibility:\s*hidden;/);
  assert.match(styles, /\.atelier-sage\.atelier-revealed \.atelier-inscription\s*\{[^}]*translateY\(0\)/s);
  assert.match(styles, /background:\s*color-mix\(in srgb, var\(--occasion-paper,[^)]+\)\s*98%, white\)/);
  assert.match(styles, /backdrop-filter:\s*none/);
});

test('Sage opens as a real 3D envelope: flap on a hinge, seal on the flap, card slides out and comes forward', () => {
  const gl = readFileSync(new URL('../src/sageEnvelope.js', import.meta.url), 'utf8');
  assert.match(cinema, /import\('\.\/sageEnvelope'\)/);
  assert.match(cinema, /className="sage-envelope-canvas"/);
  assert.match(gl, /hinge\.add\(flap\)/);
  assert.match(gl, /flap\.add\(seal\)/);
  assert.match(gl, /mix\(0, 186, inOut\(f\)\)/);
  assert.match(gl, /CARD_HIDDEN_Y, CARD_RISEN_Y/);
  assert.match(styles, /\.sage-envelope-scene\.sage-3d > :not\(canvas\)\s*\{\s*display: none;/);
});
