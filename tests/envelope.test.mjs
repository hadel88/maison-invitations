import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const cinema = readFileSync(new URL('../src/Cinema.jsx', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../src/atelier.css', import.meta.url), 'utf8');
const sage = readFileSync(new URL('../src/sageEnvelope.js', import.meta.url), 'utf8');
const guest = readFileSync(new URL('../src/Guest.jsx', import.meta.url), 'utf8');

test('Sage uses its 3D envelope renderer and places the tappable control over the wax', () => {
  assert.match(cinema, /import\('\.\/sageEnvelope'\)/);
  assert.match(cinema, /<canvas ref=\{canvas\} className="sage-envelope-canvas"/);
  assert.match(cinema, /onSeal:setSeal/);
  assert.match(cinema, /className="sage-seal-control"/);
  assert.match(sage, /flap\.add\(seal\)/);
  assert.match(sage, /sealLayers\.forEach\(\(m\) => \{ m\.material\.map = waxTex/);
  assert.match(sage, /seal\.position\.set\(0, SEAL_Y, tz\)/);
  assert.match(styles, /\.sage-seal-control\s*\{/);
});

test('the invitation card stays in the pocket until the flap starts moving and arrives before reveal', () => {
  assert.match(sage, /cardGroup\.visible = cardLoaded && t >= SAGE_TIMES\.flap\[0\]/);
  assert.match(sage, /rise: \[2\.35, 4\.45\]/);
  assert.match(sage, /forward: \[4\.25, 6\.05\]/);
  assert.match(cinema, /const rate=matchMedia\('\(prefers-reduced-motion: reduce\)'\)\.matches\?1\.45:1;instance\.play\(\(\)=>completeRef\.current\(true\),rate\)/);
  assert.match(sage, /t = \(now - start\) \/ 1000 \* playRate/);
  assert.match(styles, /\.atelier-sage\.atelier-opening \.atelier-inscription\s*\{\s*visibility:\s*hidden;/);
  assert.match(styles, /\.atelier-sage\.atelier-revealed \.atelier-inscription \{ opacity: 0; visibility: visible;/);
  assert.match(styles, /\.sage-envelope-scene \{ background: transparent;/);
});

test('Sage guest details wait until the envelope and invitation card finish moving', () => {
  assert.match(guest, /onAnimationComplete=\{\(\)=>setSageAnimationComplete\(true\)\}/);
  assert.match(guest, /opened && \(!sageEnvelope \|\| sageAnimationComplete\)/);
  assert.match(guest, /onReplay=\{\(\)=>\{setOpened\(false\);setSageAnimationComplete\(false\)\}\}/);
});

test('the Rose bow material keeps its untying motion and adds visible woven satin sheen', () => {
  const ribbon = readFileSync(new URL('../src/ribbonSatin.js', import.meta.url), 'utf8');
  assert.match(ribbon, /sheen: \.92, sheenColor: '#f7e5e3', sheenRoughness: \.34/);
  assert.match(ribbon, /specularIntensity: \.7/);
  assert.match(ribbon, /bumpMap: relief, bumpScale: \.018/);
  assert.doesNotMatch(ribbon, /roughness: \.93/);
});
