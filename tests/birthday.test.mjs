import test from 'node:test';
import assert from 'node:assert/strict';
import { birthdayLidPoint, BIRTHDAY_OPEN_END } from '../src/birthdayGL.js';
import { cinemaThemes, cinemaEvent } from '../src/cinemaThemes.js';

test('the birthday lid holds closed for the seal and rotates about a fixed rear hinge', () => {
  assert.deepEqual(birthdayLidPoint(215, 860, 12, .9, 430, 860), [215, 860, 12]);
  for (const t of [0, 1, 2.5, 4, BIRTHDAY_OPEN_END]) {
    assert.ok(birthdayLidPoint(215, 0, 12, t, 430, 860).every((v, i) => Math.abs(v - [215, 0, 12][i]) < 1e-10));
    assert.ok(birthdayLidPoint(215, 860, 2, t, 430, 860).every(Number.isFinite));
  }
  assert.ok(birthdayLidPoint(215, 860, 12, BIRTHDAY_OPEN_END, 430, 860)[1] < 0);
});
test('the birthday design creates a birthday event with a birthday schedule and its own RSVP date', () => {
  const theme = cinemaThemes.find(t => t.id === 'birthday-wish');
  const event = cinemaEvent(theme);
  assert.equal(event.occasion, 'Birthday');
  assert.equal(event.scene, 'birthday-wish');
  assert.ok(event.timeline.some(t => /candles/i.test(t.title)));
  assert.ok(event.rsvpDeadline < event.date);
  assert.equal(event.worldTheme, 'midnight');
});
