import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {cinemaThemes,cinemaEvent} from '../src/cinemaThemes.js';
import {filterInvitationDesigns,ivoryEvent,ivoryThemes} from '../src/ivoryDesigns.js';
import {occasions,templates,defaultEvent} from '../src/catalog.js';
import {worldFor} from '../src/worlds.js';
const added=['Marriage proposal','Workshops & seminars','Store & business opening','New Year’s Eve'];
test('each new occasion has all three working design families and original matching artwork',()=>{
 for(const occasion of added){
  assert.ok(occasions.includes(occasion));assert.equal(worldFor(occasion).occasion,occasion);
  for(const family of ['ribbon','sage','ivory']){
   const matches=filterInvitationDesigns(cinemaThemes,{family,occasion});assert.equal(matches.length,1,occasion+' '+family);
   const theme=matches[0];assert.ok(['proposal','workshop','opening','newyear'].includes(theme.pageLayout));
   for(const asset of [theme.cover,theme.image])assert.ok(existsSync(new URL(`../public/${asset}.webp`,import.meta.url)),asset);
   assert.ok(existsSync(new URL(`../public/${theme.cover}-sm.webp`,import.meta.url)),theme.cover+' thumbnail');
   const event=cinemaEvent(theme,{occasion:'Wedding',venue:'Wrong wedding venue',date:'2000-01-01'});
   assert.equal(event.occasion,occasion);assert.equal(event.venue,theme.venue);assert.notEqual(event.date,'2000-01-01');assert.ok(event.timeline.length>=2);
  }
 }
});
test('New Year’s Eve uses December 31 and workshop defaults use a morning programme',()=>{
 for(const theme of cinemaThemes.filter(t=>t.occasion==='New Year’s Eve')){const event=cinemaEvent(theme);assert.match(event.date,/-12-31$/);assert.equal(event.time,'20:00');assert.match(event.rsvpDeadline,/-12-15$/)}
 for(const template of templates.filter(t=>added.includes(t.occasion))){const event=defaultEvent(template);assert.equal(event.occasion,template.occasion);assert.equal(event.names,template.names);assert.notEqual(event.venue,'Villa Balbiano');if(template.occasion==='Workshops & seminars')assert.equal(event.time,'09:30')}
});
test('existing wedding defaults and the Ivory wedding entrance remain first',()=>{
 assert.equal(ivoryThemes[0].occasion,'Wedding');assert.equal(ivoryEvent(ivoryThemes[0]).timezone,'Europe/Rome');assert.equal(defaultEvent().occasion,'Wedding');
});
