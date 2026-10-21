import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {sageThemes} from '../src/sageDesigns.js';
import {cinemaThemes,cinemaEvent} from '../src/cinemaThemes.js';
import {occasionScenes,sceneVariables} from '../src/occasionScenes.js';
import {filterInvitationDesigns} from '../src/ivoryDesigns.js';

test('every existing occasion has a Sage envelope with available reveal art and matching stationery',()=>{
 assert.equal(new Set(cinemaThemes.map(t=>t.id)).size,cinemaThemes.length);
 for(const {occasion} of occasionScenes){
  const t=sageThemes.find(t=>t.occasion===occasion);assert.ok(t,occasion);
  assert.ok(existsSync(new URL(`../public/${t.image}.webp`,import.meta.url)),t.image);
  const e=cinemaEvent(t,{names:'Inherited wedding',occasion:'Wedding',message:'Inherited wedding text'});
  assert.equal(e.occasion,occasion);assert.equal(e.names,t.names);assert.ok(e.timeline.length);
  assert.notEqual(e.message,'Inherited wedding text');
  assert.equal(sceneVariables(t)['--occasion-paper'],t.paper);
  assert.equal(sceneVariables(t)['--occasion-ink'],t.ink);
 }
});
test('Sage occasion and audience filters keep boys, girls and neutral envelopes distinct',()=>{
 for(const occasion of ['Birthday','Baby shower','Christening']){
  for(const audience of ['Boys','Girls','Neutral']){
   const result=filterInvitationDesigns(cinemaThemes,{family:'sage',occasion,audience});
   assert.ok(result.length,`${occasion}: ${audience}`);
   assert.ok(result.every(t=>t.kind==='sage'&&t.occasion===occasion&&t.audience===audience));
  }
 }
 assert.equal(new Set(sageThemes.filter(t=>t.audience==='Neutral').map(t=>t.envelope)).size,occasionScenes.length);
});
