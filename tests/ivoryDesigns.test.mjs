import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {ivoryThemes,ivoryEvent,filterInvitationDesigns,monogramLetters} from '../src/ivoryDesigns.js';
import {ivoryPlaqueShapes,plaqueShape} from '../src/ivoryPlaqueShapes.js';
import {cinemaThemes} from '../src/cinemaThemes.js';
import {occasions} from '../src/catalog.js';

test('Ivory covers every existing occasion with complete cover and reveal assets',()=>{
 assert.deepEqual(new Set(ivoryThemes.map(t=>t.occasion)),new Set(occasions.filter(o=>o!=='All designs')));
 for(const theme of ivoryThemes){
  for(const suffix of ['.webp','-sm.webp'])assert.ok(existsSync(new URL('../public/'+theme.cover+suffix,import.meta.url)),theme.cover+suffix);
  assert.ok(existsSync(new URL('../public/'+theme.image+'.webp',import.meta.url)),theme.image);
  assert.equal(theme.kind,'ivory');
 }
});
test('gender-relevant occasions have boys, girls and neutral embroidery, not only recolours',()=>{
 for(const occasion of ['Birthday','Baby shower','Graduation','Christening']){
  const themes=ivoryThemes.filter(t=>t.occasion===occasion);
  assert.deepEqual(new Set(themes.map(t=>t.audience)),new Set(['Boys','Girls','Neutral']));
  assert.equal(new Set(themes.map(t=>t.cover)).size,3);
 }
});
test('every Ivory design has its own plaque silhouette and an ornament',()=>{
 assert.equal(new Set(ivoryThemes.map(t=>plaqueShape(t.plaqueShape).path)).size,ivoryThemes.length);
 for(const theme of ivoryThemes){assert.ok(ivoryPlaqueShapes[theme.plaqueShape]);assert.ok(plaqueShape(theme.plaqueShape).ornament);}
});
test('combined filters never mix families, occasions or intended audiences',()=>{
 const boys=filterInvitationDesigns(cinemaThemes,{occasion:'Birthday',family:'ivory',audience:'Boys'});
 assert.deepEqual(boys.map(t=>t.id),['ivory-birthday-boy']);
 assert.ok(filterInvitationDesigns(cinemaThemes,{family:'ribbon'}).every(t=>t.kind==='rose'));
 assert.ok(filterInvitationDesigns(cinemaThemes,{family:'other'}).every(t=>!['rose','ivory'].includes(t.kind)));
 assert.equal(filterInvitationDesigns(cinemaThemes).length,cinemaThemes.length);
 assert.equal(new Set(cinemaThemes.map(t=>t.id)).size,cinemaThemes.length);
});
test('personalised monograms use the names instead of hard-coded wedding initials',()=>{
 assert.deepEqual(monogramLetters('Clara & Adrien'),['C','A']);
 assert.deepEqual(monogramLetters('Élise et Théodore'),['É','T']);
 assert.deepEqual(monogramLetters('Leo turns 7'),['L']);
 assert.deepEqual(monogramLetters(''),[]);
});
test('occasion samples replace inherited wedding content and set suitable local times',()=>{
 const birthday=ivoryEvent(ivoryThemes.find(t=>t.id==='ivory-birthday-boy'),{message:'Wedding ceremony'});
 assert.equal(birthday.time,'14:00');assert.ok(!birthday.message.includes('Wedding ceremony'));
 assert.equal(birthday.timeline[0].time,'14:00');
 assert.equal(ivoryEvent(ivoryThemes[0]).timezone,'Europe/Rome');
});
