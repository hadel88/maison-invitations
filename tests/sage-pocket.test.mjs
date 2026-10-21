import test from 'node:test';
import assert from 'node:assert/strict';
import {Shape} from 'three';
import {traceSagePocket,sageEnvelopeProfiles} from '../src/sageEnvelopeProfiles.js';
test('each decorative pocket stays closed and preserves the centre dip for the original card rise',()=>{
 const profiles=[];
 for(const layout of Object.keys(sageEnvelopeProfiles)){
  const shape=new Shape();traceSagePocket(shape,.6,1,.34,.2,layout);const points=shape.getPoints(80);
  assert.ok(points.some(p=>Math.abs(p.x)<1e-8&&Math.abs(p.y-.2)<1e-8),layout+' centre dip');
  for(const p of points){assert.ok(p.x>=-.30001&&p.x<=.30001);assert.ok(p.y>=-.50001&&p.y<=.34001,layout+' paper bounds')}
  assert.ok(points[0].distanceTo(points.at(-1))<1e-8,layout+' closed paper outline');
  profiles.push(JSON.stringify(points));
 }
 assert.ok(new Set(profiles).size>8,'the lower opening must retain the category-specific decorative curves');
});
