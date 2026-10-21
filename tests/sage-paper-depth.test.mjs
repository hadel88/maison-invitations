import test from 'node:test';
import assert from 'node:assert/strict';
import {Shape} from 'three';
import {createSagePocketPaper,createSageFlapEdge,bendSageFlapEdge,SAGE_FLAP_DEPTH,SAGE_POCKET_DEPTH} from '../src/sagePaperDepth.js';
import {traceSageFlap,traceSagePocket,sageFlapLift,sageEnvelopeProfiles} from '../src/sageEnvelopeProfiles.js';

test('every category pocket has physical thickness and separate lit bevel faces',()=>{
 for(const layout of Object.keys(sageEnvelopeProfiles)){
  const shape=new Shape();traceSagePocket(shape,.6,1,.34,.2,layout);
  const geometry=createSagePocketPaper(shape,.6,1);geometry.computeBoundingBox();
  const bounds=geometry.boundingBox;
  assert.ok(bounds.max.z-bounds.min.z>SAGE_POCKET_DEPTH,'bevel must have actual depth');
  assert.ok(bounds.max.z<.002,'front artwork stays at its established surface');
  assert.ok(geometry.groups.some(g=>g.materialIndex===0)&&geometry.groups.some(g=>g.materialIndex===1),'printed caps and light-catching paper edges are distinct');
  const normals=geometry.attributes.normal;let sloped=0;
  for(let i=0;i<normals.count;i++)if(Math.abs(normals.getZ(i))>.05&&Math.abs(normals.getZ(i))<.95)sloped++;
  assert.ok(sloped>0,'rounded bevel needs angled normals for real highlights');geometry.dispose();
 }
});
test('flap sidewall keeps its thickness through the existing paper bend and stays attached at the hinge',()=>{
 const shape=new Shape();traceSageFlap(shape,.6,.54,'ticket');const geometry=createSageFlapEdge(shape);
 for(const bend of [0,.04,.075]){
  bendSageFlapEdge(geometry,.54,bend,sageFlapLift);const pos=geometry.attributes.position;
  for(let i=0;i<pos.count;i+=2){assert.ok(Math.abs(pos.getZ(i)-pos.getZ(i+1)-SAGE_FLAP_DEPTH)<1e-7);if(Math.abs(pos.getY(i))<1e-8)assert.ok(Math.abs(pos.getZ(i))<1e-8)}
 }
 geometry.dispose();
});
