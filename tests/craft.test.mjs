import test from 'node:test';
import assert from 'node:assert/strict';
import { eventInstant, countdownParts } from '../src/craftTime.js';
test('craft countdown follows the event timezone, including summer time, and stops at zero', () => {
  assert.equal(eventInstant('2027-06-12', '17:00', 'Europe/Paris'), Date.parse('2027-06-12T15:00:00Z'));
  assert.equal(eventInstant('2027-01-12', '17:00', 'Europe/Paris'), Date.parse('2027-01-12T16:00:00Z'));
  assert.deepEqual(countdownParts(2 * 86400000 + 3660000, 0), [2, 1, 1]);
  assert.deepEqual(countdownParts(0, 1000), [0, 0, 0]);
});
