import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {proposalRingPose,PROPOSAL_RING_DURATION} from '../src/proposalRingMotion.js';
import {cinemaThemes,cinemaEvent} from '../src/cinemaThemes.js';

test('proposal ring stays hidden in the closed box and rises only after the lid clears it',()=>{
 assert.ok(Math.abs(proposalRingPose(0).lidAngle)<1e-9);assert.equal(proposalRingPose(0).ringVisible,false);
 let previous=0;
 for(let t=0;t<=PROPOSAL_RING_DURATION;t+=.05){const p=proposalRingPose(t);assert.ok(Math.abs(p.lidAngle)>=previous-.00001);previous=Math.abs(p.lidAngle);if(p.ringVisible)assert.ok(Math.abs(p.lidAngle)>Math.PI/3);assert.ok(p.ringHeight>=.065&&p.ringHeight<=.2350001)}
 const settled=proposalRingPose(PROPOSAL_RING_DURATION);assert.ok(settled.ringVisible);assert.ok(settled.lidAngle<-Math.PI/2);assert.ok(Math.abs(settled.glint)<1e-9);
 assert.equal(proposalRingPose(0,true).ringHeight,settled.ringHeight);assert.equal(proposalRingPose(0,true).ringVisible,true);
});
test('Christmas and New Year use different festive outer art across the three signature families',()=>{
 const covers=[];
 for(const kind of ['sage','ivory','rose'])for(const occasion of ['Seasonal celebration','New Year’s Eve']){
  const theme=cinemaThemes.find(t=>t.kind===kind&&t.occasion===occasion);assert.ok(theme);
  assert.ok(theme.cover.includes(occasion==='Seasonal celebration'?'christmas':'newyear'));assert.ok(theme.cover.endsWith('v2'));
  assert.ok(existsSync(new URL(`../public/${theme.cover}.webp`,import.meta.url)));assert.ok(existsSync(new URL(`../public/${theme.cover}-sm.webp`,import.meta.url)));
  const event=cinemaEvent(theme);assert.match(event.date,occasion==='Seasonal celebration'?/-12-24$/:/-12-31$/);covers.push(theme.cover);
 }
 assert.equal(new Set(covers).size,6);
});
