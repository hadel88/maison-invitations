import test from "node:test";
import assert from "node:assert/strict";
process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_PUBLISHABLE_KEY = "test-publishable";
process.env.VERCEL = "1";
const { default: handler } = await import("../api/app.js");
function response() {
  return {
    code: 200,
    headers: {},
    setHeader(k, v) {
      this.headers[k] = v;
    },
    status(n) {
      this.code = n;
      return this;
    },
    json(d) {
      this.data = d;
      return this;
    },
    end() {
      return this;
    },
  };
}
test("sign-in accepts existing short passwords, normalizes email, and returns HttpOnly cookies without tokens", async () => {
  const orig = globalThis.fetch;
  let sent;
  globalThis.fetch = async (url, opts) => {
    sent = { url, body: JSON.parse(opts.body) };
    return {
      ok: true,
      json: async () => ({
        access_token: "test-access",
        refresh_token: "test-refresh",
        expires_in: 3600,
        user: { id: "test-user", email: "person@example.test" },
      }),
    };
  };
  try {
    const res = response();
    await handler(
      {
        method: "POST",
        query: { action: "login" },
        headers: { host: "maison.test", origin: "https://maison.test" },
        body: { email: " Person@Example.Test ", password: "sixsix" },
      },
      res,
    );
    assert.equal(res.code, 200);
    assert.equal(sent.body.email, "person@example.test");
    assert.equal(sent.body.password, "sixsix");
    assert.equal(res.data.user.id, "test-user");
    assert.ok(!("access_token" in res.data));
    assert.ok(
      res.headers["Set-Cookie"].every(
        (c) =>
          c.includes("HttpOnly") &&
          c.includes("Secure") &&
          c.includes("SameSite=Lax"),
      ),
    );
  } finally {
    globalThis.fetch = orig;
  }
});
test("cross-origin mutation is rejected before authentication", async () => {
  const res = response();
  await handler(
    {
      method: "POST",
      query: { action: "login" },
      headers: { host: "maison.test", origin: "https://evil.test" },
      body: {},
    },
    res,
  );
  assert.equal(res.code, 403);
});
test("recovery rejects foreign links without calling an external service", async () => {
  const res = response();
  await handler(
    {
      method: "POST",
      query: { action: "reset-password" },
      headers: { host: "maison.test" },
      body: {
        email: "person@example.test",
        password: "new-password",
        recovery: "https://evil.test/auth/v1/verify?type=recovery&token=secret",
      },
    },
    res,
  );
  assert.equal(res.code, 400);
  assert.match(res.data.error, /complete password recovery link/);
});
test("missing payment credentials cannot enable checkout", async () => {
  const res = response();
  await handler(
    { method: "GET", query: { action: "health" }, headers: {} },
    res,
  );
  assert.equal(res.data.payments, false);
});
test('venues & experts search is open to visitors and forwards only city, category and language',async()=>{const orig=globalThis.fetch;let sent;globalThis.fetch=async(url,opts)=>{sent={url:String(url),opts};return new Response(JSON.stringify({rows:[],city:'Paris'}),{status:200})};try{const res=response();await handler({method:'POST',query:{action:'discover'},headers:{host:'maison.test'},body:{city:'Paris',category:'photography',language:'fr',health:true,extra:'x'}},res);assert.equal(res.code,200);assert.match(sent.url,/functions\/v1\/maison-discover$/);assert.deepEqual(JSON.parse(sent.opts.body),{city:'Paris',category:'photography',language:'fr'});assert.equal(sent.opts.headers.Authorization,undefined);assert.equal(sent.opts.headers.apikey,'test-publishable')}finally{globalThis.fetch=orig}});
test('the public fixed-city preview is read-only',async()=>{const res=response();await handler({method:'POST',query:{action:'discover-demo'},headers:{host:'maison.test'},body:{city:'attacker-controlled'}},res);assert.equal(res.code,405)});

test("invitation journey is saved per invitation under a private key", async () => {
  const { default: h } = await import("../api/app.js");
  const orig = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, opts = {}) => {
    calls.push([String(url), opts.method || "GET", opts.body ? JSON.parse(opts.body) : null]);
    if (String(url).includes("/auth/v1/user")) return { ok: true, json: async () => ({ id: "u1", email: "a@b.c" }) };
    if (String(url).includes("maison_invitations")) return { ok: true, json: async () => [{ id: "x" }] };
    return { ok: true, json: async () => [{ data: { done: { "w-venue": true }, custom: [] } }] };
  };
  const res = () => ({ code: 200, headers: {}, setHeader() {}, status(n) { this.code = n; return this; }, json(d) { this.data = d; return this; }, end() { return this; } });
  const id = "11111111-2222-3333-4444-555555555555";
  try {
    const r = res();
    await h({ method: "POST", query: { action: "invitation-journey" }, headers: { host: "m.test", origin: "https://m.test", cookie: "maison_access=t" }, body: { id, plan: { done: { "w-venue": true } } } }, r);
    assert.equal(r.code, 200);
    const save = calls.find((c) => c[0].includes("maison_planning") && c[1] === "POST");
    assert.equal(save[2].occasion, "inv:" + id);
    const bad = res();
    await h({ method: "POST", query: { action: "invitation-journey" }, headers: { host: "m.test", origin: "https://m.test", cookie: "maison_access=t" }, body: { id: "../x", plan: {} } }, bad);
    assert.equal(bad.code, 400);
  } finally {
    globalThis.fetch = orig;
  }
});

test("wall rejects non-JPEG data and reports a missing table clearly", async () => {
  const { default: h, checkPlan } = await import("../api/app.js");
  assert.equal(checkPlan({ cover: "11111111-2222-3333-4444-555555555555" }).cover, "11111111-2222-3333-4444-555555555555");
  assert.throws(() => checkPlan({ cover: "x" }));
  const orig = globalThis.fetch;
  globalThis.fetch = async (url) => {
    if (String(url).includes("/auth/v1/user")) return { ok: true, json: async () => ({ id: "u1", email: "a@b.c" }) };
    return { ok: false, status: 404, json: async () => ({ message: "Could not find the table 'public.maison_wall' in the schema cache" }) };
  };
  const res = () => ({ code: 200, headers: {}, setHeader() {}, status(n) { this.code = n; return this; }, json(d) { this.data = d; return this; }, end() { return this; } });
  const hd = { host: "m.test", origin: "https://m.test", cookie: "maison_access=t" };
  const inv = "11111111-2222-3333-4444-555555555555";
  try {
    const bad = res();
    await h({ method: "POST", query: { action: "wall" }, headers: hd, body: { invitation_id: inv, kind: "photo", image: "data:text/html;base64,AAAA" } }, bad);
    assert.equal(bad.code, 400);
    const miss = res();
    await h({ method: "GET", query: { action: "wall", id: inv }, headers: hd }, miss);
    assert.equal(miss.code, 501);
    assert.equal(miss.data.code, "wall_migration_missing");
  } finally {
    globalThis.fetch = orig;
  }
});
test('experts-list returns approved listings with photo thumbs and sanitises the city filter',async()=>{const orig=globalThis.fetch;let url;globalThis.fetch=async(u)=>{url=String(u);return new Response(JSON.stringify([{id:'a',name:'Rosa',maison_expert_photos:[{id:'p1',thumb:'data:x'}]}]),{status:200})};try{const res=response();await handler({method:'GET',query:{action:'experts-list',category:'flowers',city:'Frank*furt (x), Germany'},headers:{host:'maison.test'}},res);assert.equal(res.code,200);assert.match(url,/status=eq\.approved&category=eq\.flowers&city=ilike\.\*Frank%20furt%20%20x\*/);assert.deepEqual(res.data,[{id:'a',name:'Rosa',photos:[{id:'p1',thumb:'data:x'}]}])}finally{globalThis.fetch=orig}});
test('experts-list ignores unknown categories without calling the database',async()=>{const orig=globalThis.fetch;let called=false;globalThis.fetch=async()=>{called=true;return new Response('[]')};try{const res=response();await handler({method:'GET',query:{action:'experts-list',category:'weapons',city:'Paris'},headers:{host:'maison.test'}},res);assert.deepEqual(res.data,[]);assert.equal(called,false)}finally{globalThis.fetch=orig}});
test('a quote request without an account needs email or phone, and the honeypot is rejected',async()=>{const orig=globalThis.fetch;let body;globalThis.fetch=async(u,o)=>{body=JSON.parse(o.body);return new Response(JSON.stringify('11111111-1111-1111-1111-111111111111'),{status:200})};try{const base={listing_id:'22222222-2222-2222-2222-222222222222',name:'Ann',message:'Hello there'};let res=response();await handler({method:'POST',query:{action:'expert-request'},headers:{host:'maison.test'},body:base},res);assert.equal(res.code,400);res=response();await handler({method:'POST',query:{action:'expert-request'},headers:{host:'maison.test'},body:{...base,email:'a@b.de',website:'spam'}},res);assert.equal(res.code,400);res=response();await handler({method:'POST',query:{action:'expert-request'},headers:{host:'maison.test'},body:{...base,email:'a@b.de',guests:'80',date:'2027-05-01',budget:'€2000'}},res);assert.equal(res.code,200);assert.equal(body.p_email,'a@b.de');assert.equal(body.p_guests,80);assert.equal(body.p_date,'2027-05-01')}finally{globalThis.fetch=orig}});
test('the expert business space requires sign-in',async()=>{for(const action of ['expert-me','expert-inbox','expert-admin']){const res=response();await handler({method:'GET',query:{action},headers:{host:'maison.test'}},res);assert.equal(res.code,401)}});
