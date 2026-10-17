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
test('arbitrary local discovery still requires authentication',async()=>{const res=response();await handler({method:'POST',query:{action:'discover'},headers:{host:'maison.test'},body:{city:'Paris',category:'venues'}},res);assert.equal(res.code,401)});
test('the public fixed-city preview is read-only',async()=>{const res=response();await handler({method:'POST',query:{action:'discover-demo'},headers:{host:'maison.test'},body:{city:'attacker-controlled'}},res);assert.equal(res.code,405)});
