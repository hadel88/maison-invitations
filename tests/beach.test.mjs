import test from 'node:test';
import assert from 'node:assert/strict';
import { BEACH_STEPS, BEACH_COPY, nextBeachStep } from '../src/beachFlow.js';

test('the beach demo follows exactly five guest interactions in order', () => {
  assert.deepEqual(BEACH_STEPS,['doors','heart','ring','arch','rsvp']);
  let step=0;
  for(const interaction of BEACH_STEPS) step=nextBeachStep(step,interaction);
  assert.equal(step,5);
  assert.equal(BEACH_COPY.length,5);
  assert.match(BEACH_COPY[4].title,/Maya.*Arjun/);
});

test('unrelated or repeated taps cannot skip chapters or advance a completed demo', () => {
  assert.equal(nextBeachStep(0,'ring'),0);
  assert.equal(nextBeachStep(1,'doors'),1);
  assert.equal(nextBeachStep(3,'rsvp'),3);
  assert.equal(nextBeachStep(5,'rsvp'),5);
  assert.equal(nextBeachStep(5,undefined),5);
  assert.equal(nextBeachStep(-1,undefined),-1);
});
