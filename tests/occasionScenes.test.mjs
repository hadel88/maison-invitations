import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {occasionScenes,filterScenes,occasionEvent} from '../src/occasionScenes.js';
import {cinemaThemes} from '../src/cinemaThemes.js';
import {occasions} from '../src/catalog.js';

test('every existing occasion has a distinct door, reveal and chiffon palette',()=>{
 assert.deepEqual(new Set(occasionScenes.map(x=>x.occasion)),new Set(occasions.filter(x=>x!=='All designs')));
 for(const key of ['cover','image','ribbonFilter'])assert.equal(new Set(occasionScenes.map(x=>x[key])).size,occasionScenes.length,key);
 for(const scene of occasionScenes){
  assert.ok(existsSync(new URL('../public/'+scene.cover+'.webp',import.meta.url)),scene.cover);
  assert.ok(existsSync(new URL('../public/'+scene.cover+'-sm.webp',import.meta.url)),scene.cover+' thumbnail');
  assert.ok(existsSync(new URL('../public/'+scene.image+'.webp',import.meta.url)),scene.image);
 }
});
test('filters include only the chosen occasion and never hide its bow invitation',()=>{
 for(const scene of occasionScenes){
  const matches=filterScenes(cinemaThemes,scene.occasion);
  assert.ok(matches.some(t=>t.id===scene.id));
  assert.ok(matches.every(t=>t.occasion===scene.occasion));
 }
 assert.equal(filterScenes(cinemaThemes).length,cinemaThemes.length);
 assert.equal(new Set(cinemaThemes.map(t=>t.id)).size,cinemaThemes.length);
});
test('occasion samples retain the selected occasion and replace inherited wedding content',()=>{
 for(const scene of occasionScenes){
  const event=occasionEvent(scene,{message:'Wedding ceremony',gifts:[{title:'Wedding gift'}]});
  assert.equal(event.scene,scene.id);assert.equal(event.occasion,scene.occasion);
  assert.equal(event.venue,scene.venue);assert.equal(event.subtitle,scene.line);
  assert.ok(!event.message.includes('Wedding ceremony'));assert.deepEqual(event.gifts,[]);
 }
});
