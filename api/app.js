import { createHmac } from "node:crypto";
import { providerSources } from '../src/providers.js';
import { eventWorlds } from '../src/worlds.js';
import { validateSeating } from '../src/seating.js';
const SB = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
const cookie = (req, name) => {
  const s = (req.headers.cookie || "")
    .split(";")
    .find((x) => x.trim().startsWith(name + "="));
  return s ? decodeURIComponent(s.trim().slice(name.length + 1)) : null;
};
function setSession(res, s) {
  const secure = process.env.VERCEL ? "Secure; " : "";
  res.setHeader("Set-Cookie", [
    `maison_access=${encodeURIComponent(s.access_token)}; HttpOnly; ${secure}SameSite=Lax; Path=/api; Max-Age=${s.expires_in || 3600}`,
    `maison_refresh=${encodeURIComponent(s.refresh_token)}; HttpOnly; ${secure}SameSite=Lax; Path=/api; Max-Age=2592000`,
  ]);
}
async function sb(path, { token, method = "GET", body, headers = {} } = {}) {
  const r = await fetch(`${SB}${path}`, {
    method,
    headers: {
      apikey: KEY,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "Content-Type": "application/json",
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await r.json().catch(() => null);
  if (!r.ok) {
    const e = new Error(
      data?.msg ||
        data?.message ||
        data?.error_description ||
        "The service could not complete this request.",
    );
    e.status = r.status;
    throw e;
  }
  return data;
}
async function session(req, res) {
  let token = cookie(req, "maison_access");
  if (token) {
    try {
      return { token, user: await sb("/auth/v1/user", { token }) };
    } catch {}
  }
  const refresh = cookie(req, "maison_refresh");
  if (refresh) {
    try {
      const s = await sb("/auth/v1/token?grant_type=refresh_token", {
        method: "POST",
        body: { refresh_token: refresh },
      });
      setSession(res, s);
      return { token: s.access_token, user: s.user };
    } catch {}
  }
  return null;
}
function bodyOf(req) {
  if (typeof req.body === "object") return req.body;
  try {
    return JSON.parse(req.body || "{}");
  } catch {
    throw Object.assign(new Error("Invalid JSON"), { status: 400 });
  }
}
export function checkEvent(c) {
  const validDate = (v) =>
    /^\d{4}-\d{2}-\d{2}$/.test(v) &&
    new Date(v + "T12:00:00Z").toISOString().slice(0, 10) === v;
  if (
    !c ||
    typeof c.names !== "string" ||
    c.names.length < 1 ||
    c.names.length > 160 ||
    !validDate(c.date) ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(c.time) ||
    !validDate(c.rsvpDeadline)
  )
    throw Object.assign(
      new Error("Please check the event name, date, time and RSVP deadline."),
      { status: 400 },
    );
  try {
    new Intl.DateTimeFormat("en", { timeZone: c.timezone });
  } catch {
    throw Object.assign(new Error("Invalid timezone"), { status: 400 });
  }
  const dataImage = (v) => !v || (typeof v === "string" && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(v));
  if (![c.photo, c.photo2, c.photo3, c.photo4].every(dataImage))
    throw Object.assign(
      new Error("Upload a JPG, PNG or WebP photo using the editor."),
      { status: 400 },
    );
  const text = (v, n) => v == null || (typeof v === "string" && v.length <= n);
  const list = (v, max, ok) => v == null || (Array.isArray(v) && v.length <= max && v.every((x) => x && typeof x === "object" && ok(x)));
  if (
    !list(c.timeline, 30, (t) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t.time) && typeof t.title === "string" && t.title.trim() && text(t.title, 120) && text(t.note, 300)) ||
    !list(c.gifts, 40, (g) => typeof g.title === "string" && g.title.trim() && text(g.title, 140) && text(g.note, 300) && (!g.link || /^https?:\/\/[^\s]{3,500}$/i.test(g.link))) ||
    !text(c.font, 20)
  )
    throw Object.assign(new Error("Please check the programme and gift list."), { status: 400 });
  if (JSON.stringify(c).length > 2400000)
    throw Object.assign(new Error("Please choose a smaller photo."), {
      status: 400,
    });
}
export function checkPlan(p) {
  const bad = () =>
    Object.assign(new Error("Please check your journey tasks."), {
      status: 400,
    });
  if (!p || typeof p !== "object" || Array.isArray(p)) throw bad();
  const done = {};
  for (const [k, v] of Object.entries(p.done || {})) {
    if (!/^[a-z0-9-]{1,40}$/i.test(k) || typeof v !== "boolean") throw bad();
    if (v) done[k] = true;
  }
  const custom = p.custom || [];
  if (!Array.isArray(custom) || custom.length > 60) throw bad();
  const clean = custom.map((t) => {
    if (
      !t ||
      !/^c-[a-z0-9]{4,20}$/i.test(t.id) ||
      typeof t.title !== "string" ||
      t.title.trim().length < 1 ||
      t.title.length > 120 ||
      !/^\d{4}-\d{2}-\d{2}$/.test(t.due)
    )
      throw bad();
    return { id: t.id, title: t.title.trim(), due: t.due };
  });
  if (Object.keys(done).length > 200) throw bad();
  if (p.cover != null && !/^[0-9a-f-]{36}$/i.test(String(p.cover))) throw bad();
  return { done, custom: clean, ...(p.cover ? { cover: p.cover } : {}) };
}
const paymentsReady = () =>
  !!(
    process.env.STRIPE_SECRET_KEY &&
    process.env.STRIPE_WEBHOOK_SECRET &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.APP_URL
  );
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  try {
    const action = req.query.action || "session";
    if (!["GET", "POST", "DELETE"].includes(req.method))
      return res.status(405).json({ error: "Method not allowed" });
    if (req.method !== "GET" && req.headers.origin) {
      const origin = new URL(req.headers.origin);
      if (origin.host !== req.headers.host)
        return res.status(403).json({ error: "Origin rejected" });
    }
    if (!SB || !KEY)
      return res.status(503).json({ error: "Database connection is pending." });
    const b = req.method === "GET" ? {} : bodyOf(req);
    if (action === "health")
      return res.json({ database: true, payments: paymentsReady() });
    if(action==='discover-demo'||action==='provider-status'){
      if(req.method!=='GET')return res.status(405).end();
      const r=await fetch(SB+'/functions/v1/maison-discover?'+(action==='discover-demo'?'demo=1':'health=1'),{headers:{apikey:KEY}});
      return res.status(r.status).json(await r.json());
    }
    // Venues & experts search is open to everyone. Signed-in hosts pass their session so their
    // own daily allowance applies; visitors share one allowance. Cached areas cost nothing.
    if(action==='discover'){
      if(req.method!=='POST')return res.status(405).end();
      const v=await session(req,res);
      const headers={apikey:KEY,'Content-Type':'application/json'};
      if(v?.token)headers.Authorization='Bearer '+v.token;else if(KEY.startsWith('eyJ'))headers.Authorization='Bearer '+KEY;
      let r;try{r=await fetch(SB+'/functions/v1/maison-discover',{method:'POST',headers,body:JSON.stringify({city:b.city,category:b.category,language:b.language}),signal:AbortSignal.timeout(40000)})}catch{return res.status(504).json({error:'The search took too long. Please try again in a moment.'})}
      let data;try{data=await r.json()}catch{data={error:'Search is temporarily unavailable. Try the directories below.'}}
      return res.status(r.status).json(data);
    }
    if (action === "recover") {
      if (req.method !== "POST") return res.status(405).end();
      if (typeof b.email !== "string" || !b.email.includes("@"))
        return res
          .status(400)
          .json({ error: "Enter your account email address." });
      await sb("/auth/v1/recover", {
        method: "POST",
        body: { email: b.email.trim().toLowerCase() },
      });
      return res.json({ sent: true });
    }
    if (action === "reset-password") {
      if (req.method !== "POST") return res.status(405).end();
      if (
        typeof b.password !== "string" ||
        b.password.length < 8 ||
        typeof b.recovery !== "string"
      )
        return res
          .status(400)
          .json({
            error:
              "Use a password of at least 8 characters and your recovery link.",
          });
      let tokenHash;
      try {
        const u = new URL(b.recovery.trim());
        if (
          u.origin !== new URL(SB).origin ||
          u.pathname !== "/auth/v1/verify" ||
          u.searchParams.get("type") !== "recovery"
        )
          throw new Error();
        tokenHash = u.searchParams.get("token");
        if (!tokenHash) throw new Error();
      } catch {
        return res
          .status(400)
          .json({
            error:
              "Paste the complete password recovery link from your email. Copy the link without opening it.",
          });
      }
      const s = await sb("/auth/v1/verify", {
        method: "POST",
        body: { token_hash: tokenHash, type: "recovery" },
      });
      if (
        !s.access_token ||
        s.user?.email?.toLowerCase() !== b.email?.trim().toLowerCase()
      )
        return res
          .status(400)
          .json({
            error: "This recovery link does not match the email you entered.",
          });
      await sb("/auth/v1/user", {
        method: "PUT",
        token: s.access_token,
        body: { password: b.password },
      });
      setSession(res, s);
      return res.json({ user: { id: s.user.id, email: s.user.email } });
    }
    if (action === "login" || action === "signup") {
      if (req.method !== "POST") return res.status(405).end();
      if (
        typeof b.email !== "string" ||
        !b.email.includes("@") ||
        typeof b.password !== "string" ||
        b.password.length < (action === "signup" ? 8 : 1)
      )
        return res
          .status(400)
          .json({
            error:
              action === "signup"
                ? "Use a valid email and a password of at least 8 characters."
                : "Enter your email and password.",
          });
      const s = await sb(
        action === "signup"
          ? "/auth/v1/signup"
          : "/auth/v1/token?grant_type=password",
        {
          method: "POST",
          body: { email: b.email.trim().toLowerCase(), password: b.password },
        },
      );
      if (s.access_token) setSession(res, s);
      return res.json({
        user: s.access_token ? { id: s.user.id, email: s.user.email } : null,
        confirmation: !s.access_token,
      });
    }
    if (action === 'guest-photo' || action === 'guest-wish' || action === 'shared-photo') {
      if ((action !== 'shared-photo' && req.method !== 'POST') || (action === 'shared-photo' && req.method !== 'GET')) return res.status(405).end();
      const args = req.method === 'GET' ? req.query : b;
      const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if(!uuid.test(args.slug||'')||!uuid.test(args.guest||''))return res.status(403).json({error:'A selected guest link is required.'});
      if(action==='shared-photo'){
        if(!uuid.test(args.photo||''))return res.status(400).json({error:'Photo not found.'});
        const photo=await sb('/rest/v1/rpc/maison_guest_photo_read',{method:'POST',body:{p_slug:args.slug,p_token:args.guest,p_photo:args.photo}});
        return photo?res.json(photo):res.status(403).json({error:'Photo unavailable or access removed.'});
      }
      const jpeg=(value,max)=>typeof value==='string'&&value.length<max&&/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(value);
      if((action==='guest-photo'&&(!jpeg(b.image,900000)||!jpeg(b.thumb,60000)))||typeof(b.caption||'')!=='string'||(b.caption||'').length>500||(action==='guest-wish'&&!(b.caption||'').trim())||b.consent!==true)
        return res.status(400).json({error:'Choose a photo, a short caption, and confirm you may share it.'});
      const row=await sb('/rest/v1/rpc/maison_guest_photo_add',{method:'POST',body:{p_slug:b.slug,p_token:b.guest,p_image:action==='guest-photo'?b.image:null,p_thumb:action==='guest-photo'?b.thumb:null,p_caption:b.caption||''}});
      return row?res.json(row):res.status(403).json({error:'Your host has not shared access, or has revoked it.'});
    }
    if (action === "shared-dashboard") {
      if (req.method !== "GET") return res.status(405).end();
      const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuid.test(req.query.slug || '') || !uuid.test(req.query.guest || ''))
        return res.status(403).json({ error: 'Your host has not shared this dashboard with this guest link.' });
      const data = await sb('/rest/v1/rpc/maison_shared_dashboard', { method: 'POST', body: { p_slug: req.query.slug, p_token: req.query.guest } });
      return data ? res.json(data) : res.status(403).json({ error: 'Dashboard access is unavailable. Your host may have removed access or unpublished the invitation.' });
    }
    if (action === "open")
      return res.json(
        await sb("/rest/v1/rpc/maison_open", {
          method: "POST",
          body: { p_slug: req.query.slug, p_token: req.query.guest || null },
        }),
      );
    if (action === "rsvp") {
      if (req.method !== "POST") return res.status(405).end();
      if (b.website) return res.status(400).json({ error: "Invalid request" });
      return res.json(
        await sb("/rest/v1/rpc/maison_respond", {
          method: "POST",
          body: {
            p_slug: b.slug,
            p_token: b.token,
            p_name: b.name,
            p_response: b.response,
            p_party_size: Number(b.partySize),
            p_note: b.note || "",
          },
        }),
      );
    }
    // ── Maison experts: approved listings are public; requests work signed in or not ──
    const EXPERT_CATS = ["venues","planners","dining","flowers","photography","bridal","music","cakes","beauty","decoration","family"];
    const uuidOk = (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v || ""));
    const expertsMissing = (e) => /maison_expert|maison_admins|maison_is_admin/.test(e.message) && /(schema cache|does not exist|Could not find)/i.test(e.message);
    const expertsNotReady = (res) => res.status(501).json({ error: "Expert listings are not activated yet. Run database/experts.sql once in Supabase.", code: "experts_migration_missing" });
    const LISTING_PUBLIC = "id,name,category,city,address,description,services,price_from,phone,website,created_at";
    if (action === "experts-list") {
      if (req.method !== "GET") return res.status(405).end();
      const cat = String(req.query.category || "");
      const town = String(req.query.city || "").split(",")[0].trim().replace(/[%_*(),.]/g, " ").trim().slice(0, 60);
      if (!EXPERT_CATS.includes(cat) || town.length < 2) return res.json([]);
      try {
        const rows = await sb(`/rest/v1/maison_expert_listings?status=eq.approved&category=eq.${cat}&city=ilike.*${encodeURIComponent(town)}*&select=${LISTING_PUBLIC},maison_expert_photos(id,thumb)&order=created_at.desc&limit=24`);
        return res.json(rows.map(({ maison_expert_photos: ph, ...l }) => ({ ...l, photos: (ph || []).map((p) => ({ id: p.id, thumb: p.thumb })) })));
      } catch (e) {
        if (expertsMissing(e)) return res.json([]);
        throw e;
      }
    }
    if (action === "expert-photo") {
      if (!uuidOk(req.query.id)) return res.status(400).json({ error: "Photo not found" });
      const v = await session(req, res);
      const r = await sb(`/rest/v1/maison_expert_photos?id=eq.${req.query.id}&select=id,image`, { token: v?.token });
      return r.length ? res.json(r[0]) : res.status(404).json({ error: "Photo not found" });
    }
    if (action === "expert-request") {
      if (req.method !== "POST") return res.status(405).end();
      if (b.website) return res.status(400).json({ error: "Invalid request" });
      const v = await session(req, res);
      const txt = (x, n) => String(x ?? "").trim().slice(0, n);
      const email = txt(b.email, 120), phone = txt(b.phone, 40);
      if (!uuidOk(b.listing_id) || txt(b.name, 80).length < 2 || txt(b.message, 3000).length < 5)
        return res.status(400).json({ error: "Please add your name and a short message." });
      if (!v && !email && !phone) return res.status(400).json({ error: "Please add your email or phone so the expert can answer." });
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Please check your email address." });
      const date = /^\d{4}-\d{2}-\d{2}$/.test(String(b.date || "")) ? b.date : null;
      const guests = Number.isInteger(Number(b.guests)) && Number(b.guests) > 0 && Number(b.guests) <= 5000 ? Number(b.guests) : null;
      try {
        const id = await sb("/rest/v1/rpc/maison_expert_request", {
          method: "POST",
          token: v?.token,
          body: { p_listing: b.listing_id, p_name: txt(b.name, 80), p_email: email, p_phone: phone, p_date: date, p_guests: guests, p_budget: txt(b.budget, 60), p_message: txt(b.message, 3000) },
        });
        return res.json({ id, signedIn: !!v });
      } catch (e) {
        if (expertsMissing(e)) return expertsNotReady(res);
        if (/not available|own listing|Too many/i.test(e.message)) return res.status(400).json({ error: e.message });
        throw e;
      }
    }
    const s = await session(req, res);
    if (action === "session")
      return res.json({
        user: s ? { id: s.user.id, email: s.user.email } : null,
      });
    if (!s)
      return res
        .status(401)
        .json({ error: "Please sign in to save your invitation." });
    if (action.startsWith("expert-")) {
      const t = { token: s.token };
      const txt = (x, n) => String(x ?? "").trim().slice(0, n);
      try {
        if (action === "expert-me") {
          if (req.method === "GET") {
            const [rows, admin] = await Promise.all([
              sb(`/rest/v1/maison_expert_listings?owner_id=eq.${s.user.id}&select=*,maison_expert_photos(id,thumb)`, t),
              sb("/rest/v1/rpc/maison_is_admin", { ...t, method: "POST", body: {} }),
            ]);
            const l = rows[0];
            return res.json({ listing: l ? { ...l, maison_expert_photos: undefined, photos: l.maison_expert_photos || [] } : null, admin: !!admin });
          }
          if (req.method === "DELETE") {
            await sb(`/rest/v1/maison_expert_listings?owner_id=eq.${s.user.id}`, { ...t, method: "DELETE" });
            return res.json({ ok: true });
          }
          const site = txt(b.website, 300);
          const row = {
            name: txt(b.name, 120), category: String(b.category || ""), city: txt(b.city, 80), address: txt(b.address, 200),
            description: txt(b.description, 2000), services: txt(b.services, 1000), price_from: txt(b.price_from, 60),
            phone: txt(b.phone, 40), email: txt(b.email, 120), website: site && /^https?:\/\//i.test(site) ? site : site ? "https://" + site : "",
          };
          if (row.name.length < 2 || row.city.length < 2 || !EXPERT_CATS.includes(row.category))
            return res.status(400).json({ error: "Please add your business name, category and city." });
          if (!row.phone && !row.email && !row.website)
            return res.status(400).json({ error: "Please add at least one way to reach you: phone, email or website." });
          const existing = await sb(`/rest/v1/maison_expert_listings?owner_id=eq.${s.user.id}&select=id`, t);
          const saved = existing.length
            ? await sb(`/rest/v1/maison_expert_listings?id=eq.${existing[0].id}`, { ...t, method: "PATCH", body: row, headers: { Prefer: "return=representation" } })
            : await sb("/rest/v1/maison_expert_listings", { ...t, method: "POST", body: { ...row, owner_id: s.user.id }, headers: { Prefer: "return=representation" } });
          return res.json(saved[0]);
        }
        if (action === "expert-photos") {
          if (req.method === "DELETE") {
            if (!uuidOk(b.id)) return res.status(400).json({ error: "Photo not found" });
            await sb(`/rest/v1/maison_expert_photos?id=eq.${b.id}`, { ...t, method: "DELETE" });
            return res.json({ ok: true });
          }
          const jpeg = (v, max) => typeof v === "string" && /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(v) && v.length < max;
          if (!uuidOk(b.listing_id) || !jpeg(b.thumb, 80000) || !jpeg(b.image, 360000))
            return res.status(400).json({ error: "Please choose a JPEG, PNG or WebP photo." });
          const rows = await sb("/rest/v1/maison_expert_photos", { ...t, method: "POST", body: { listing_id: b.listing_id, owner_id: s.user.id, thumb: b.thumb, image: b.image }, headers: { Prefer: "return=representation" } });
          return res.json({ id: rows[0].id, thumb: rows[0].thumb });
        }
        if (action === "expert-inbox") {
          const rows = await sb(`/rest/v1/maison_expert_requests?select=*,maison_expert_listings(name,category,city,phone)&order=created_at.desc&limit=200`, t);
          return res.json(rows.map(({ maison_expert_listings: l, ...r }) => ({ ...r, listing: l, mine: r.expert_id === s.user.id })));
        }
        if (action === "expert-thread") {
          if (req.method === "GET") {
            if (!uuidOk(req.query.id)) return res.status(400).json({ error: "Conversation not found" });
            return res.json(await sb(`/rest/v1/maison_expert_messages?request_id=eq.${req.query.id}&select=id,from_expert,body,created_at&order=created_at.asc&limit=500`, t));
          }
          if (!uuidOk(b.request_id)) return res.status(400).json({ error: "Conversation not found" });
          const reqs = await sb(`/rest/v1/maison_expert_requests?id=eq.${b.request_id}&select=id,expert_id,sender_id,status`, t);
          if (!reqs.length) return res.status(404).json({ error: "Conversation not found" });
          const r = reqs[0], fromExpert = r.expert_id === s.user.id;
          if (b.status) {
            if (!fromExpert || !["new", "answered", "closed"].includes(b.status)) return res.status(400).json({ error: "Not allowed" });
            await sb(`/rest/v1/maison_expert_requests?id=eq.${r.id}`, { ...t, method: "PATCH", body: { status: b.status } });
            return res.json({ ok: true });
          }
          const body = txt(b.body, 3000);
          if (!body) return res.status(400).json({ error: "Write a message first." });
          if (!fromExpert && r.sender_id !== s.user.id) return res.status(403).json({ error: "Not allowed" });
          const rows = await sb("/rest/v1/maison_expert_messages", { ...t, method: "POST", body: { request_id: r.id, author_id: s.user.id, from_expert: fromExpert, body }, headers: { Prefer: "return=representation" } });
          if (fromExpert && r.status === "new") await sb(`/rest/v1/maison_expert_requests?id=eq.${r.id}`, { ...t, method: "PATCH", body: { status: "answered" } });
          return res.json(rows[0]);
        }
        if (action === "expert-admin") {
          if (req.method === "GET")
            return res.json(await sb(`/rest/v1/maison_expert_listings?status=neq.approved&select=*,maison_expert_photos(id,thumb)&order=updated_at.desc&limit=100`, t));
          if (!uuidOk(b.id) || !["approved", "hidden", "pending"].includes(b.status)) return res.status(400).json({ error: "Not allowed" });
          const rows = await sb(`/rest/v1/maison_expert_listings?id=eq.${b.id}`, { ...t, method: "PATCH", body: { status: b.status }, headers: { Prefer: "return=representation" } });
          if (!rows.length) return res.status(403).json({ error: "Only an admin can do this." });
          return res.json(rows[0]);
        }
      } catch (e) {
        if (expertsMissing(e)) return expertsNotReady(res);
        throw e;
      }
    }
    if(action==='seating'){
      if(!['GET','POST'].includes(req.method))return res.status(405).end();
      const id=req.method==='GET'?req.query.id:b.id;
      if(!/^[0-9a-f-]{36}$/i.test(id||''))return res.status(400).json({error:'Choose an invitation.'});
      const own=await sb('/rest/v1/maison_invitations?id=eq.'+encodeURIComponent(id)+'&select=id',{token:s.token});
      if(!own?.length)return res.status(404).json({error:'Invitation not found.'});
      const key='seating:'+id;
      if(req.method==='GET'){const rows=await sb('/rest/v1/maison_planning?occasion=eq.'+encodeURIComponent(key)+'&select=data',{token:s.token});return res.json(rows[0]?.data||{tables:[],assignments:{}})}
      const guests=await sb('/rest/v1/maison_guests?invitation_id=eq.'+encodeURIComponent(id)+'&select=id,name,response,party_size',{token:s.token});
      const seating=validateSeating(b.seating,guests);
      await sb('/rest/v1/maison_planning?on_conflict=owner_id,occasion',{method:'POST',token:s.token,body:{owner_id:s.user.id,occasion:key,data:seating,updated_at:new Date().toISOString()},headers:{Prefer:'resolution=merge-duplicates'}});
      return res.json(seating);
    }
    if(action==='journey'){
      const [planning,shortlist,guests]=await Promise.all([
        sb('/rest/v1/maison_planning?select=*',{token:s.token}),
        sb('/rest/v1/maison_shortlist?select=*&order=created_at.desc',{token:s.token}),
        sb('/rest/v1/maison_guests?select=id,invitation_id,response,party_size',{token:s.token})
      ]);return res.json({planning,shortlist,guests});
    }
    if (action === "invitation-journey") {
      // One journey per invitation (package 2), stored privately in maison_planning
      // under the key "inv:<invitation id>". Never part of the public invitation.
      const id = req.method === "GET" ? req.query.id : b.id;
      if (!/^[0-9a-f-]{36}$/i.test(String(id || "")))
        return res.status(400).json({ error: "Invitation not found" });
      const key = "inv:" + id;
      if (req.method === "GET") {
        const rows = await sb(
          `/rest/v1/maison_planning?occasion=eq.${encodeURIComponent(key)}&select=data`,
          { token: s.token },
        );
        return res.json({ plan: rows[0]?.data || { done: {}, custom: [] } });
      }
      if (req.method !== "POST") return res.status(405).end();
      const own = await sb(
        `/rest/v1/maison_invitations?id=eq.${encodeURIComponent(id)}&select=id`,
        { token: s.token },
      );
      if (!own.length) return res.status(404).json({ error: "Invitation not found" });
      const plan = checkPlan(b.plan);
      const rows = await sb("/rest/v1/maison_planning?on_conflict=owner_id,occasion", {
        method: "POST",
        token: s.token,
        body: { owner_id: s.user.id, occasion: key, data: plan, updated_at: new Date().toISOString() },
        headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      });
      return res.json({ plan: rows[0]?.data || plan });
    }
    if (action === "wall") {
      // Posts and photos of one invitation (package 2). Private to the host.
      const missing = (e) =>
        /maison_wall/.test(e.message) && /(schema cache|does not exist)/i.test(e.message);
      const idOk = (v) => /^[0-9a-f-]{36}$/i.test(String(v || ""));
      try {
        if (req.method === "GET") {
          if (req.query.photo) {
            if (!idOk(req.query.photo)) return res.status(400).json({ error: "Photo not found" });
            const r = await sb(`/rest/v1/maison_wall?id=eq.${req.query.photo}&select=id,image`, { token: s.token });
            return r.length ? res.json(r[0]) : res.status(404).json({ error: "Photo not found" });
          }
          if (!idOk(req.query.id)) return res.status(400).json({ error: "Invitation not found" });
          return res.json(
            await sb(
              `/rest/v1/maison_wall?invitation_id=eq.${req.query.id}&select=id,kind,body,thumb,created_at&order=created_at.desc&limit=300`,
              { token: s.token },
            ),
          );
        }
        if (req.method === "DELETE") {
          if (!idOk(b.id)) return res.status(400).json({ error: "Not found" });
          await sb(`/rest/v1/maison_wall?id=eq.${b.id}`, { token: s.token, method: "DELETE" });
          return res.json({ ok: true });
        }
        const jpeg = (v, max) =>
          v == null || (typeof v === "string" && /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(v) && v.length < max);
        if (
          !idOk(b.invitation_id) ||
          !["post", "photo"].includes(b.kind) ||
          typeof (b.body ?? "") !== "string" ||
          (b.body || "").length > 2000 ||
          (b.kind === "post" && !(b.body || "").trim() && !b.image) ||
          (b.kind === "photo" && !b.image) ||
          !jpeg(b.thumb, 120000) ||
          !jpeg(b.image, 900000)
        )
          return res.status(400).json({ error: "Please check your post or photo." });
        const rows = await sb("/rest/v1/maison_wall", {
          method: "POST",
          token: s.token,
          body: {
            owner_id: s.user.id,
            invitation_id: b.invitation_id,
            kind: b.kind,
            body: (b.body || "").trim(),
            thumb: b.thumb || null,
            image: b.image || null,
          },
          headers: { Prefer: "return=representation" },
        });
        const { image, ...row } = rows[0];
        return res.json(row);
      } catch (e) {
        if (missing(e))
          return res.status(501).json({
            error: "Wall and photos are not activated yet. Run database/wall.sql once in Supabase.",
            code: "wall_migration_missing",
          });
        throw e;
      }
    }
    if(action==='planning'){
      if(req.method!=='POST')return res.status(405).end();
      if(!eventWorlds.some(w=>w.occasion===b.occasion)||!b.data||JSON.stringify(b.data).length>19000||!(Number(b.data.budget||0)>=0)||Number(b.data.budget||0)>10000000)return res.status(400).json({error:'Please check your planning details.'});
      const rows=await sb('/rest/v1/maison_planning?on_conflict=owner_id,occasion',{method:'POST',token:s.token,body:{owner_id:s.user.id,occasion:b.occasion,data:b.data,updated_at:new Date().toISOString()},headers:{Prefer:'resolution=merge-duplicates,return=representation'}});return res.json(rows[0]);
    }
    if(action==='shortlist'){
      if(req.method==='GET')return res.json(await sb('/rest/v1/maison_shortlist?select=*&order=created_at.desc',{token:s.token}));
      if(req.method==='DELETE'){await sb('/rest/v1/maison_shortlist?id=eq.'+encodeURIComponent(b.id),{method:'DELETE',token:s.token});return res.json({ok:true})}
      if(!eventWorlds.some(w=>w.occasion===b.occasion)||typeof b.provider_id!=='string'||b.provider_id.length>300||!b.data||JSON.stringify(b.data).length>19000||typeof b.data.name!=='string'||b.data.name.length>160)return res.status(400).json({error:'Please check the expert details.'});
      if(!b.provider_id.startsWith('geo:')&&!b.provider_id.startsWith('maison:')&&!providerSources.some(p=>p.id===b.provider_id))return res.status(400).json({error:'Unknown expert source'});
      const rows=await sb('/rest/v1/maison_shortlist?on_conflict=owner_id,occasion,provider_id',{method:'POST',token:s.token,body:{owner_id:s.user.id,occasion:b.occasion,provider_id:b.provider_id,data:b.data},headers:{Prefer:'resolution=merge-duplicates,return=representation'}});return res.json(rows[0]);
    }
    if (action === "logout") {
      if (req.method !== "POST") return res.status(405).end();
      await sb("/auth/v1/logout", { token: s.token, method: "POST" }).catch(
        () => {},
      );
      res.setHeader("Set-Cookie", [
        "maison_access=; HttpOnly; SameSite=Lax; Path=/api; Max-Age=0",
        "maison_refresh=; HttpOnly; SameSite=Lax; Path=/api; Max-Age=0",
      ]);
      return res.json({ ok: true });
    }
    if (action === "invitations") {
      if (req.method === "GET")
        return res.json(
          await sb(
            "/rest/v1/maison_invitations?select=*&order=created_at.desc",
            { token: s.token },
          ),
        );
      if (req.method === "DELETE") {
        await sb(
          `/rest/v1/maison_invitations?id=eq.${encodeURIComponent(b.id)}`,
          { token: s.token, method: "DELETE" },
        );
        await sb(
          `/rest/v1/maison_planning?occasion=eq.${encodeURIComponent("inv:" + b.id)}`,
          { token: s.token, method: "DELETE" },
        ).catch(() => {});
        return res.json({ ok: true });
      }
      checkEvent(b.content);
      const data = await sb(
        "/rest/v1/maison_invitations" +
          (b.id ? `?id=eq.${encodeURIComponent(b.id)}` : ""),
        {
          token: s.token,
          method: b.id ? "PATCH" : "POST",
          body: {
            content: b.content,
            published: !!b.published,
            updated_at: new Date().toISOString(),
          },
          headers: { Prefer: "return=representation" },
        },
      );
      if (!data?.length)
        return res.status(404).json({ error: "Invitation not found" });
      return res.json(data[0]);
    }
    if (action === "guest-dashboard-access") {
      if (req.method !== 'POST') return res.status(405).end();
      if (typeof b.enabled !== 'boolean' || !/^[0-9a-f-]{36}$/i.test(b.id || ''))
        return res.status(400).json({ error: 'Choose a guest and a sharing setting.' });
      // The caller's JWT and existing invitation-owner RLS enforce ownership.
      const rows = await sb('/rest/v1/maison_guests?id=eq.' + encodeURIComponent(b.id), {
        token: s.token, method: 'PATCH', body: { dashboard_access: b.enabled }, headers: { Prefer: 'return=representation' },
      });
      if (!rows?.length) return res.status(404).json({ error: 'Guest not found.' });
      return res.json(rows[0]);
    }
    if (action === "guests") {
      if (req.method === "DELETE") {
        await sb(`/rest/v1/maison_guests?id=eq.${encodeURIComponent(b.id)}`, {token:s.token,method:'DELETE'});
        return res.json({ok:true});
      }
      if (req.method === "GET")
        return res.json(
          await sb(
            `/rest/v1/maison_guests?invitation_id=eq.${encodeURIComponent(req.query.id)}&select=*&order=created_at.desc`,
            { token: s.token },
          ),
        );
      if (
        typeof b.name !== "string" ||
        b.name.trim().length < 1 ||
        b.name.length > 120
      )
        return res.status(400).json({ error: "Please enter a guest name." });
      const g = await sb("/rest/v1/maison_guests", {
        token: s.token,
        method: "POST",
        body: { invitation_id: b.invitation_id, name: b.name.trim() },
        headers: { Prefer: "return=representation" },
      });
      return res.json(g[0]);
    }
    if (action === "export") {
      const invites = await sb("/rest/v1/maison_invitations?select=*", {
        token: s.token,
      });
      const guests = await sb("/rest/v1/maison_guests?select=*", {
        token: s.token,
      });
      const [planning,shortlist]=await Promise.all([sb('/rest/v1/maison_planning?select=*',{token:s.token}),sb('/rest/v1/maison_shortlist?select=*',{token:s.token})]);
      return res.json({
        exportedAt: new Date().toISOString(),
        invitations: invites,
        guests,
        planning,shortlist,
      });
    }
    if (action === "delete-data") {
      if (req.method !== "DELETE") return res.status(405).end();
      await sb('/rest/v1/maison_shortlist?owner_id=eq.'+s.user.id,{token:s.token,method:'DELETE'});
      await sb('/rest/v1/maison_planning?owner_id=eq.'+s.user.id,{token:s.token,method:'DELETE'});
      await sb(`/rest/v1/maison_invitations?owner_id=eq.${s.user.id}`, {
        token: s.token,
        method: "DELETE",
      });
      return res.json({ ok: true });
    }
    if (action === "checkout") {
      if (req.method !== "POST") return res.status(405).end();
      if (!paymentsReady())
        return res
          .status(503)
          .json({
            error:
              "Checkout is not connected yet. You can create, preview and share a free Maison invitation. No payment has been taken.",
          });
      const invite = (
        await sb(
          `/rest/v1/maison_invitations?id=eq.${encodeURIComponent(b.id)}&select=id,owner_id`,
          { token: s.token },
        )
      )[0];
      if (!invite)
        return res.status(404).json({ error: "Invitation not found" });
      const plans = { essential: 1900, signature: 2900, celebration: 4900 };
      if (!plans[b.plan])
        return res.status(400).json({ error: "Invalid plan" });
      const base = process.env.APP_URL;
      if (!base)
        return res
          .status(503)
          .json({ error: "Payment return URL is not configured." });
      const form = new URLSearchParams({
        mode: "payment",
        success_url: base + "/?payment=processing",
        cancel_url: base + "/?payment=cancelled",
        "line_items[0][price_data][currency]": "eur",
        "line_items[0][price_data][unit_amount]": String(plans[b.plan]),
        "line_items[0][price_data][product_data][name]": "Maison " + b.plan,
        "line_items[0][quantity]": "1",
        "metadata[owner_id]": s.user.id,
        "metadata[invitation_id]": invite.id,
        "metadata[plan]": b.plan,
        client_reference_id: invite.id,
      });
      const r = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",
          "Idempotency-Key": createHmac("sha256", process.env.STRIPE_SECRET_KEY)
            .update(
              `${s.user.id}:${invite.id}:${b.plan}:${Math.floor(Date.now() / 600000)}`,
            )
            .digest("hex"),
        },
        body: form,
      });
      const d = await r.json();
      if (!r.ok)
        throw new Error("Stripe could not start checkout. Please try later.");
      return res.json({ url: d.url });
    }
    return res.status(404).json({ error: "Not found" });
  } catch (e) {
    return res
      .status(e.status >= 400 && e.status < 500 ? e.status : 400)
      .json({ error: e.message || "Something went wrong. Please try again." });
  }
}
