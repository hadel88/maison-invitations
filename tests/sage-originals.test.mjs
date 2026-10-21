import test from 'node:test';
import assert from 'node:assert/strict';
import {sageEnvelopeProfiles,traceSageFlap} from '../src/sageEnvelopeProfiles.js';
import {paintSageLetter} from '../src/paintSageLetter.js';
import {sageThemes} from '../src/sageDesigns.js';

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
