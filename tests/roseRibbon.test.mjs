import test from 'node:test';
import assert from 'node:assert/strict';
import {roseRibbonPoint,ribbonRow} from '../src/roseRibbonGeometry.js';
test('rose chiffon cloth stays finite through the complete preserved untying sequence',()=>{
  for(const kind of ['loop','tail','band','knot'])for(const side of [-1,1])for(const time of [0,.6,.9,1.5,2.4,2.5,3,4,5.2])for(const u of [0,.1,.25,.5,.75,.9,1])for(const v of [0,.02,.3,.5,.7,.98,1])assert.ok(roseRibbonPoint(u,v,side,kind,time).every(Number.isFinite),`${kind}/${time}/${u}/${v}`);
});
test('the wrapped knot has a closed fabric seam before it unravels',()=>{
  for(const time of [0,.8,1.7])for(const v of [0,.25,.5,.75,1]){
    const a=ribbonRow(0,1,'knot',time)(v),b=ribbonRow(1,1,'knot',time)(v);
    assert.ok(Math.hypot(...a.map((n,i)=>n-b[i]))<.0001);
  }
});
test('rose cloth falls clear rather than disappearing during its release',()=>{
  assert.ok(roseRibbonPoint(.5,.5,1,'loop',5.2)[1]<-15);
  assert.ok(roseRibbonPoint(.5,.5,1,'loop',2.5)[1]>-1);
});
