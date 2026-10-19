import test from 'node:test';
import assert from 'node:assert/strict';
process.env.SUPABASE_URL='https://example.supabase.co';process.env.SUPABASE_PUBLISHABLE_KEY='test';
const {default:handler}=await import('../api/app.js');
const id='aabbccdd-1122-3344-5566-778899aabbcc';
const res=()=>({code:200,headers:{},setHeader(k,v){this.headers[k]=v},status(n){this.code=n;return this},json(d){this.data=d;return this},end(){return this}});
test('memory contributions reject missing consent, invalid image types and missing guest links before DB access',async()=>{
 for(const body of [{slug:id,guest:id,image:'data:image/svg+xml;base64,abc',thumb:'data:image/jpeg;base64,/9j/AA==',consent:true},{slug:id,guest:id,image:'data:image/jpeg;base64,/9j/AA==',thumb:'data:image/jpeg;base64,/9j/AA=='},{consent:true}]){const r=res();await handler({method:'POST',query:{action:'guest-photo'},headers:{host:'maison.test'},body},r);assert.ok([400,403].includes(r.code))}
});
test('wish contributes through capability RPC and revoked capability is denied',async()=>{
 const original=globalThis.fetch;let count=0;globalThis.fetch=async(url,opts)=>{assert.match(url,/maison_guest_photo_add$/);const b=JSON.parse(opts.body);assert.equal(b.p_token,id);assert.equal(b.p_image,null);assert.equal(b.p_caption,'Congratulations!');return {ok:true,json:async()=>++count===1?{id,kind:'post'}:null}};
 try{for(const expected of [200,403]){const r=res();await handler({method:'POST',query:{action:'guest-wish'},headers:{host:'maison.test'},body:{slug:id,guest:id,caption:'Congratulations!',consent:true}},r);assert.equal(r.code,expected)}}finally{globalThis.fetch=original}
});
test('seating mutations require a signed-in host',async()=>{const r=res();await handler({method:'POST',query:{action:'seating'},headers:{host:'maison.test'},body:{id,seating:{tables:[],assignments:{}}}},r);assert.equal(r.code,401)});
test('photo reads require both the guest capability and the photo ID',async()=>{const r=res();await handler({method:'GET',query:{action:'shared-photo',slug:id,guest:id,photo:'invalid'},headers:{}},r);assert.equal(r.code,400)});
