import test from 'node:test';
import assert from 'node:assert/strict';
import { stationeryDocument } from '../src/stationeryDocument.js';
process.env.SUPABASE_URL='https://example.supabase.co';
process.env.SUPABASE_PUBLISHABLE_KEY='test';
const {default:handler}=await import('../api/app.js');
const uuid='aabbccdd-1122-3344-5566-778899aabbcc';
function response(){return {code:200,headers:{},setHeader(k,v){this.headers[k]=v},status(c){this.code=c;return this},json(d){this.data=d;return this},end(){return this}}}
test('shared dashboard requires a guest capability and cannot be written',async()=>{
 for(const [method,query,code] of [['GET',{slug:uuid},403],['GET',{slug:uuid,guest:'invalid'},403],['POST',{slug:uuid,guest:uuid},405]]){const res=response();await handler({method,query:{action:'shared-dashboard',...query},headers:{host:'maison.test'},body:{}},res);assert.equal(res.code,code)}
});
test('shared dashboard rechecks permission for every request and maps revoked access to 403',async()=>{
 const previous=globalThis.fetch;let calls=0;
 globalThis.fetch=async(url,options)=>{assert.match(url,/rpc\/maison_shared_dashboard$/);assert.deepEqual(JSON.parse(options.body),{p_slug:uuid,p_token:uuid});calls++;return {ok:true,json:async()=>calls===1?{event:{names:'Test'}}:null}};
 try{for(const code of [200,403]){const res=response();await handler({method:'GET',query:{action:'shared-dashboard',slug:uuid,guest:uuid},headers:{}},res);assert.equal(res.code,code);assert.equal(res.headers['Cache-Control'],'no-store')}}finally{globalThis.fetch=previous}
});
test('anonymous callers cannot grant dashboard access',async()=>{const res=response();await handler({method:'POST',query:{action:'guest-dashboard-access'},headers:{host:'maison.test'},body:{id:uuid,enabled:true}},res);assert.equal(res.code,401)});
test('printable stationery escapes guest content and rejects CSS injection',()=>{const html=stationeryDocument({title:'<script>alert(1)</script>',lines:['<img src=x onerror=alert(1)>','Hala & Friends'],accent:'red;}</style><script>'});assert.ok(!html.includes('<script>'));assert.ok(!html.includes('<img'));assert.ok(html.includes('&lt;script&gt;'));assert.ok(html.includes('Hala &amp; Friends'));assert.ok(html.includes('#8e9976'))});
