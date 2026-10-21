import test from 'node:test';
import assert from 'node:assert/strict';
import {sageEnvelopeProfiles,traceSageFlap,sageFlapLift} from '../src/sageEnvelopeProfiles.js';
import {paintSageLetter} from '../src/paintSageLetter.js';
import {sageThemes} from '../src/sageDesigns.js';
import {paperCoverTile} from '../src/invitationMaterials.js';
import {readFileSync} from 'node:fs';

test('paper stock covers the full panel without transparent top or bottom bands',()=>{
 for(const [iw,ih] of [[1024,1536],[941,1672],[1536,1024]]){
  for(const [width,height,envWidth] of [[1024,1707,.6],[2560,1440,1.78],[1024,2275,.6]]){
   const tile=paperCoverTile(iw,ih,width,height,envWidth);
   assert.ok(tile.top<=.00001);
   assert.ok(tile.top+tile.height>=height-.00001);
   assert.ok(tile.width>=width*.6/envWidth-.00001);
   assert.ok(Math.abs(tile.width/tile.height-iw/ih)<.00001,'artwork aspect ratio is preserved');
  }
 }
});
test('loading fallback uses the chosen design, never a hardcoded green stock',()=>{
 const css=readFileSync(new URL('../src/atelier.css',import.meta.url),'utf8');
 const component=readFileSync(new URL('../src/Cinema.jsx',import.meta.url),'utf8');
 assert.ok(!css.includes("url('/atelier-sage-cover.webp')"));
 assert.ok(!css.includes("url('/atelier-sage.webp')"));
 assert.match(component,/--sage-cover.*design\.materialCover/);
 assert.match(css,/background: var\(--sage-cover, none\)/);
});

test('flap fold stays attached to the envelope body throughout rotation',()=>{
 const rootLift=sageFlapLift(0,.54);
 assert.equal(rootLift,0,'the hinge edge must not float in front of the body');
 for(let degrees=0;degrees<=186;degrees+=3){
  const angle=degrees*Math.PI/180;
  assert.equal(Math.abs(rootLift*Math.sin(angle)),0,'no vertical tear at any opening angle');
 }
 assert.ok(sageFlapLift(-.54,.54)>.009,'the free edge must clear the closed pocket');
 assert.ok(sageFlapLift(-.27,.54)<sageFlapLift(-.54,.54),'lift should taper smoothly back to the fold');
});

test('original Sage artwork never borrows an Ivory door asset',()=>{
 assert.equal(sageThemes.length,16);
 assert.equal(new Set(sageThemes.map(t=>t.materialCover)).size,16);
 for(const theme of sageThemes)assert.ok(theme.materialCover.startsWith('sage-original-'),theme.id);
});
test('the ten envelope flap outlines are distinct and remain inside physical paper bounds',()=>{
 const signatures=[];
 for(const layout of Object.keys(sageEnvelopeProfiles)){
  const calls=[],pen=Object.fromEntries(['moveTo','lineTo','bezierCurveTo','closePath'].map(name=>[name,(...args)=>calls.push([name,...args])]));
  traceSageFlap(pen,.6,.54,layout);
  assert.equal(calls.at(-1)[0],'closePath');
  for(const [, ...values] of calls)for(let i=0;i<values.length;i+=2){assert.ok(Math.abs(values[i])<=.3+.00001);assert.ok(values[i+1]<=0&&values[i+1]>=-.57)}
  signatures.push(JSON.stringify(calls));
 }
 assert.equal(new Set(signatures).size,10);
});
test('each first invitation sheet has a different composition and preserves editable event details',()=>{
 const signatures=[];
 for(const theme of sageThemes.filter(t=>t.audience==='Neutral'&&t.pageLayout!=='arch')){
  const calls=[],texts=[],target={measureText:value=>({width:String(value).length*18})};
  const g=new Proxy(target,{get(obj,key){if(key in obj)return obj[key];return(...args)=>{calls.push([key,...args]);if(key==='fillText')texts.push(args[0])}},set(obj,key,value){obj[key]=value;return true}});
  assert.equal(paintSageLetter(g,1024,1638,{names:'Alex & Sam',date:'19 JUNE 2027',venue:'Maison Hall',overline:'Please join us',subtitle:'An evening together'},theme),true);
  const printed=texts.join(' ');for(const value of ['Alex','Sam','19 JUNE 2027','Maison Hall'])assert.ok(printed.includes(value),theme.id+' '+value);
  signatures.push(JSON.stringify(calls));
 }
 assert.equal(new Set(signatures).size,9);
});
