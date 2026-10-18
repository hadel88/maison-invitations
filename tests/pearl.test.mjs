import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {cinemaThemes} from '../src/cinemaThemes.js';
const data=JSON.parse(readFileSync(new URL('../src/pearlFilm.json',import.meta.url)));

test('Pearl & Promise tracking is locked to its own exact video, independently of Castle films',()=>{
  const theme=cinemaThemes.find(t=>t.id==='pearl-promise');assert.equal(theme?.kind,'pearl');
  for(const name of ['pearl-film.mp4','pearl-film-poster.webp','pearl-film-end.webp',theme.cover+'.webp',theme.cover+'-sm.webp'])assert.ok(existsSync(new URL('../public/'+name,import.meta.url)),name);
  const hash=createHash('sha256').update(readFileSync(new URL('../public/pearl-film.mp4',import.meta.url))).digest('hex');
  assert.equal(hash,data.videoSha256,'Video changed: re-track this film before shipping it.');
  assert.equal(data.fps,24);assert.equal(data.frameW,720);assert.equal(data.frameH,1280);assert.equal(data.band,null);
  assert.equal(data.first,0);assert.equal(data.frames.length,data.frameCount);assert.equal(data.duration*data.fps,data.frameCount);
});
test('the opening book, all four portraits, and the last invitation each have tracked surfaces',()=>{
  const early=data.frames.slice(0,120).flat(),portraits=data.frames.slice(480,720).flat(),end=data.frames.at(-1);
  assert.ok(early.some(x=>x[1]==='book1'));assert.ok(early.some(x=>x[1]==='book2'));
  for(const id of [1,2,3,4])assert.ok(portraits.filter(x=>x[0]===0&&x[1]===id).length>190,'Insufficient coverage for photo '+id);
  assert.ok(end.some(x=>x[0]===1&&x[1]==='card'&&x[10]===1));
});
test('tracked surfaces never contain invalid coordinates or opacity',()=>{
  for(const [f,items]of data.frames.entries())for(const it of items){
    assert.equal(it.length,12,'frame '+f);assert.ok(it.slice(2,10).every(Number.isFinite),'frame '+f);
    assert.ok(it[10]>=0&&it[10]<=1,'opacity at '+f);assert.ok(it[11]===0,'This video has no person-mask band.');
  }
});
