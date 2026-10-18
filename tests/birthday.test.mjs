import test from 'node:test';
import assert from 'node:assert/strict';
import { giftPanelPoint, birthdayCakePlacement, diplomaPoint, celebrationPhases, CELEBRATION_END } from '../src/celebrationCanvas.js';
import { cinemaThemes, cinemaEvent } from '../src/cinemaThemes.js';

test('the gift panels open around their fixed bottom edges after the lid releases', () => {
  assert.deepEqual(giftPanelPoint(1,.8,1,'front',0),[1,.8,1]);
  for (const t of [0,1,2.5,4,CELEBRATION_END]) {
    assert.deepEqual(giftPanelPoint(1,-.8,1,'front',t),[1,-.8,1]);
    for (const side of ['front','back','left','right']) assert.ok(giftPanelPoint(1,.8,1,side,t).every(Number.isFinite));
  }
  assert.equal(celebrationPhases(.5).lid,0);
  assert.equal(celebrationPhases(1).panels,0);
  assert.ok(giftPanelPoint(1,.8,1,'front',4)[1]<-.8);
});

test('graduation paper unrolls into a flat diploma and lifts clear before revealing the invitation', () => {
  assert.deepEqual(diplomaPoint(.5,0,4),[0,1.45,-.25]);
  const bottom=diplomaPoint(.5,1,4);
  assert.ok(Math.abs(bottom[1]+1.55)<1e-10);
  assert.equal(bottom[2],-.25);
  assert.ok(diplomaPoint(.5,1,CELEBRATION_END)[1]>3);
  for(const t of [0,1.3,2.5,4,6.2]) for(const v of [0,.25,.5,.75,1]) assert.ok(diplomaPoint(.5,v,t).every(Number.isFinite));
});

test('graduation has its own occasion, cap opening and celebration schedule', () => {
  const event=cinemaEvent(cinemaThemes.find(t=>t.id==='graduation-flight'));
  assert.equal(event.occasion,'Graduation');
  assert.equal(event.scene,'graduation-flight');
  assert.ok(event.timeline.some(t=>/caps/i.test(t.title)));
  assert.ok(event.rsvpDeadline<event.date);
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


test('the complete birthday cake fits below the closed lid and only grows after the panels open', () => {
  const closed=birthdayCakePlacement(0);
  assert.ok(closed.y+closed.height/2<.8);
  assert.ok(closed.y-closed.height/2>-.8);
  assert.deepEqual(birthdayCakePlacement(2.8),closed);
  assert.ok(celebrationPhases(2.8).panels>.5);
  assert.equal(birthdayCakePlacement(6.2).height,closed.height*2);
  assert.equal(birthdayCakePlacement(6.2).reveal,1);
});

test('the crimson graduation curtain is an additional theme with graduation content', () => {
  const theme=cinemaThemes.find(t=>t.id==='graduation-curtain'),event=cinemaEvent(theme);
  assert.equal(theme.motif,'curtain');
  assert.equal(theme.cover,'graduation-burgundy-curtain');
  assert.equal(event.occasion,'Graduation');
  assert.ok(event.timeline.some(t=>/graduate/i.test(t.title)));
  assert.ok(cinemaThemes.some(t=>t.id==='graduation-flight'));
});
