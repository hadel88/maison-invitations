import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {cinemaThemes,cinemaEvent} from '../src/cinemaThemes.js';
const data=JSON.parse(readFileSync(new URL('../src/babyFilm.json',import.meta.url)));
test('A Little Wonder is a separate baby shower film with matching video and assets',()=>{
 const theme=cinemaThemes.find(t=>t.id==='little-wonder');assert.equal(theme?.kind,'baby-film');assert.equal(theme.occasion,'Baby shower');
 const event=cinemaEvent(theme,{});assert.equal(event.occasion,'Baby shower');assert.match(event.message,/growing family/);assert.ok(event.timeline.every(x=>!x.title.includes('ceremony')));
 for(const f of ['baby-film.mp4','baby-film-poster.webp','baby-film-end.webp',theme.cover+'.webp',theme.cover+'-sm.webp'])assert.ok(existsSync(new URL('../public/'+f,import.meta.url)),f);
 assert.equal(createHash('sha256').update(readFileSync(new URL('../public/baby-film.mp4',import.meta.url))).digest('hex'),data.videoSha256);
 assert.equal(data.fps,24);assert.equal(data.frameW,720);assert.equal(data.frameH,1280);assert.equal(data.frames.length,960);assert.equal(data.duration,40);
});
test('four memories cover the gallery and the personalised card covers its entire final shot',()=>{
 for(const id of ['memory1','memory2','memory3','memory4'])assert.ok(data.frames.slice(240,480).flat().filter(x=>x[1]===id&&x[10]===1).length>=40,id);
 for(let f=240;f<480;f++)assert.ok(data.frames[f].some(x=>x[0]===0&&x[10]===1),'Missing gallery coverage at '+f);
 for(let f=864;f<960;f++)assert.ok(data.frames[f].some(x=>x[1]==='card'&&x[10]===1),'Missing personalised card at '+f);
 assert.ok(data.foreground['276']);assert.ok(data.cardPocket['870']);
});
test('baby film quads stay finite, clockwise and nondegenerate through motion',()=>{
 for(const [f,items] of data.frames.entries())for(const it of items){
  assert.equal(it.length,12);assert.ok(it.slice(2,10).every(Number.isFinite),'Invalid coordinate '+f);assert.ok(it[10]>=0&&it[10]<=1);assert.equal(it[11],0);
  const q=it.slice(2,10);let area=0;for(let i=0;i<4;i++){const j=(i+1)%4;area+=q[2*i]*q[2*j+1]-q[2*j]*q[2*i+1];}assert.ok(area>50,'Inverted or collapsed quad '+f);
 }
});
