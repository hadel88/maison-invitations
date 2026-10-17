// maison-discover: venues & experts near a European city.
// Two sources, merged and de-duplicated:
//   • Geoapify Places (OpenStreetMap data; storing results is allowed; credit "Powered by Geoapify")
//   • OpenStreetMap via the public Overpass API (no key; ODbL; fair use ≈10,000 requests/day)
// Each city + category is fetched once and then served to everyone from maison_discovery_cache
// for 30 days. Signed-in users and visitors can search; new (uncached) areas count against
// the daily quota in maison_search_quota (20 per identity, 100 in total), so the free
// Geoapify allowance of 3,000 credits/day is never at risk.
const SB = Deno.env.get("SUPABASE_URL")!;
const ADMIN = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GEO = Deno.env.get("GEOAPIFY_API_KEY");
const CACHE_DAYS = 30;
const RADIUS_M = 12000;
const VISITOR = "00000000-0000-4000-8000-000000000002"; // shared quota identity for signed-out visitors
const DEMO = "00000000-0000-4000-8000-000000000001";
const EUROPE = ["de","fr","gb","ie","it","es","pt","at","ch","nl","be","lu","dk","se","no","fi","pl","cz","gr","hu","ro","hr","si","sk","ee","lv","lt","is","mt","cy","bg"];

// Category keys checked against the Geoapify Places docs (apidocs.geoapify.com/docs/places) and
// tags checked on the OpenStreetMap wiki. "" = Geoapify has no matching category, OSM only.
const CATEGORIES: Record<string, { geo: string; osm: string[] }> = {
  venues: { geo: "activity.events_venue,accommodation.hotel,tourism.sights.conference_centre,activity.community_center", osm: ['amenity="events_venue"', 'amenity="conference_centre"', 'tourism="hotel"'] },
  planners: { geo: "", osm: ['office="event_management"'] },
  dining: { geo: "catering.restaurant", osm: ['craft="caterer"', 'amenity="restaurant"'] },
  flowers: { geo: "commercial.florist", osm: ['shop="florist"'] },
  photography: { geo: "service.photographer", osm: ['craft="photographer"', 'shop="photo"'] },
  bridal: { geo: "commercial.wedding", osm: ['shop="wedding"'] },
  music: { geo: "", osm: ['amenity="music_venue"', 'amenity="nightclub"'] },
  cakes: { geo: "commercial.food_and_drink.bakery,commercial.food_and_drink.confectionery,catering.cafe.cake", osm: ['shop="pastry"', 'shop="confectionery"', 'shop="bakery"'] },
  beauty: { geo: "service.beauty", osm: ['shop="beauty"', 'shop="hairdresser"'] },
  decoration: { geo: "", osm: ['shop="party"'] },
  family: { geo: "entertainment.activity_park,entertainment.escape_game,entertainment.miniature_golf,entertainment.bowling_alley,entertainment.theme_park", osm: ['leisure="indoor_play"'] },
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
async function db(path: string, method = "GET", body?: unknown) {
  return fetch(SB + "/rest/v1/" + path, {
    method,
    headers: { apikey: ADMIN, Authorization: "Bearer " + ADMIN, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}
const safe = (value: unknown, max = 300) => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
const website = (v: unknown) => {
  try {
    const u = new URL(String(v));
    return ["https:", "http:"].includes(u.protocol) ? u.href : null;
  } catch {
    return null;
  }
};
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9äöüßéèàç]/g, "");

// Real photos, only where OpenStreetMap links a freely licensed Wikimedia Commons file
// (tags wikimedia_commons=File:… or image=<commons/upload.wikimedia URL>). Other image URLs are
// skipped because their licence is unknown.
function commonsTitle(t: Record<string, any>): string | null {
  const wc = String(t.wikimedia_commons || "");
  if (/^File:/i.test(wc)) return "File:" + wc.slice(5).trim();
  const img = String(t.image || "");
  let m = img.match(/commons\.wikimedia\.org\/wiki\/(File:[^?#]+)/i);
  if (m) return decodeURIComponent(m[1]).replace(/_/g, " ");
  m = img.match(/upload\.wikimedia\.org\/wikipedia\/commons\/(?:thumb\/)?[0-9a-f]\/[0-9a-f]{2}\/([^/?#]+)/i);
  if (m) return "File:" + decodeURIComponent(m[1]).replace(/_/g, " ");
  return null;
}
const strip = (html: unknown) => safe(String(html ?? "").replace(/<[^>]*>/g, " "), 80);

async function addPhotos(rows: any[]) {
  const wanted = rows.filter((r) => r.commons).slice(0, 50);
  if (!wanted.length) return;
  const url = new URL("https://commons.wikimedia.org/w/api.php");
  url.search = new URLSearchParams({
    action: "query", format: "json", prop: "imageinfo", iiprop: "url|extmetadata", iiurlwidth: "640",
    iiextmetadatafilter: "Artist|LicenseShortName", titles: [...new Set(wanted.map((r) => r.commons))].join("|"),
  }).toString();
  try {
    const r = await fetch(url, { headers: { "User-Agent": "MaisonInvitations/1.0 (venues & experts search)" }, signal: AbortSignal.timeout(5000) });
    if (!r.ok) return;
    const data = await r.json();
    const norm: Record<string, string> = {};
    for (const n of data.query?.normalized || []) norm[n.from] = n.to;
    const pages: Record<string, any> = {};
    for (const pg of Object.values<any>(data.query?.pages || {})) if (pg.imageinfo?.[0]) pages[pg.title] = pg.imageinfo[0];
    for (const row of wanted) {
      const info = pages[norm[row.commons] || row.commons];
      if (!info?.thumburl) continue;
      const meta = info.extmetadata || {};
      row.photo = info.thumburl;
      row.photoSource = info.descriptionurl;
      row.photoCredit = [strip(meta.Artist?.value) || "Unknown author", strip(meta.LicenseShortName?.value), "Wikimedia Commons"].filter(Boolean).join(" · ");
    }
  } catch { /* photos are optional */ }
}

async function fromGeoapify(cat: string, loc: any, language: string) {
  if (!GEO || !CATEGORIES[cat].geo) return [];
  const url = new URL("https://api.geoapify.com/v2/places");
  url.search = new URLSearchParams({
    categories: CATEGORIES[cat].geo,
    filter: `circle:${loc.lon},${loc.lat},${RADIUS_M}`,
    bias: `proximity:${loc.lon},${loc.lat}`,
    limit: "40",
    lang: language,
    apiKey: GEO,
  }).toString();
  const r = await fetch(url, { signal: AbortSignal.timeout(9000) });
  if (!r.ok) return [];
  const data = await r.json();
  return (data.features || [])
    .map((f: any) => {
      const p = f.properties || {}, raw = p.datasource?.raw || {};
      return {
        id: "g:" + p.place_id,
        name: safe(p.name, 160),
        address: safe(p.formatted, 350),
        website: website(p.website || raw.website || raw["contact:website"]),
        phone: safe(p.contact?.phone || raw.phone || raw["contact:phone"], 60),
        lat: p.lat,
        lng: p.lon,
        category: cat,
        distance: p.distance ? Math.round(p.distance) : null,
        source: "Geoapify / OpenStreetMap",
        commons: commonsTitle(raw),
      };
    })
    .filter((p: any) => p.name && p.id);
}

async function fromOverpass(cat: string, loc: any) {
  const around = `(around:${RADIUS_M},${loc.lat},${loc.lon})`;
  const q = `[out:json][timeout:9];(${CATEGORIES[cat].osm.map((t) => `nwr[${t}]${around};`).join("")});out center 60;`;
  const r = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "MaisonInvitations/1.0 (venues & experts search)" },
    body: "data=" + encodeURIComponent(q),
    signal: AbortSignal.timeout(10000),
  });
  if (!r.ok) return [];
  const data = await r.json();
  return (data.elements || [])
    .map((e: any) => {
      const t = e.tags || {};
      const street = [t["addr:street"], t["addr:housenumber"]].filter(Boolean).join(" ");
      const town = [t["addr:postcode"], t["addr:city"]].filter(Boolean).join(" ");
      return {
        id: `o:${e.type}/${e.id}`,
        name: safe(t.name, 160),
        address: safe([street, town].filter(Boolean).join(", "), 350),
        website: website(t.website || t["contact:website"]),
        phone: safe(t.phone || t["contact:phone"], 60),
        lat: e.lat ?? e.center?.lat,
        lng: e.lon ?? e.center?.lon,
        category: cat,
        distance: null,
        source: "OpenStreetMap",
        commons: commonsTitle(t),
      };
    })
    .filter((p: any) => p.name);
}

// Geoapify first, then OpenStreetMap entries that Geoapify did not already have.
export function merge(a: any[], b: any[], max = 60) {
  const byName = new Map(a.map((p) => [norm(p.name), p]));
  const extra: any[] = [];
  for (const p of b) {
    const k = norm(p.name), same = byName.get(k);
    if (same) { if (!same.commons && p.commons) same.commons = p.commons; continue; }
    byName.set(k, p);
    extra.push(p);
  }
  return [...a, ...extra].slice(0, max);
}

async function nominatim(city: string, language: string) {
  const u = new URL("https://nominatim.openstreetmap.org/search");
  u.search = new URLSearchParams({ q: city, format: "jsonv2", limit: "1", addressdetails: "1", "accept-language": language }).toString();
  const r = await fetch(u, { headers: { "User-Agent": "MaisonInvitations/1.0 (venues & experts search)" }, signal: AbortSignal.timeout(6000) }).catch(() => null);
  if (!r?.ok) return null;
  const hit = (await r.json())?.[0];
  if (!hit) return null;
  const a = hit.address || {};
  return { lat: +hit.lat, lon: +hit.lon, country_code: a.country_code, country: a.country, city: a.city || a.town || a.village || hit.name, name: hit.name };
}

async function identity(req: Request) {
  const auth = req.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) return VISITOR;
  const ur = await fetch(SB + "/auth/v1/user", { headers: { Authorization: auth, apikey: Deno.env.get("SUPABASE_ANON_KEY")! } });
  if (!ur.ok) return VISITOR;
  return (await ur.json()).id || VISITOR;
}

Deno.serve(async (req: Request) => {
  const urlInfo = new URL(req.url);
  const demo = req.method === "GET" && urlInfo.searchParams.get("demo") === "1";
  if (req.method === "GET" && urlInfo.searchParams.get("health") === "1")
    return json({ configured: !!GEO, provider: "Geoapify + OpenStreetMap" });
  if (req.method !== "POST" && !demo) return json({ error: "Method not allowed" }, 405);
  try {
    const user = demo ? DEMO : await identity(req);
    const body = demo ? { city: "Frankfurt, Germany", category: "venues", language: "en" } : await req.json();
    if (body.health) return json({ configured: !!GEO, provider: "Geoapify + OpenStreetMap" });
    const city = safe(body.city, 80);
    const category = String(body.category || "venues");
    const language = ["en", "de", "fr"].includes(body.language) ? body.language : "en";
    if (city.length < 2 || !CATEGORIES[category]) return json({ error: "Choose a city and a supported search category." }, 400);

    const key = "v3:" + city.toLowerCase() + ":" + category + ":" + language;
    const cache = await db("maison_discovery_cache?cache_key=eq." + encodeURIComponent(key) + "&expires_at=gt." + encodeURIComponent(new Date().toISOString()) + "&select=data");
    if (cache.ok) {
      const cached = await cache.json();
      if (cached[0]) return json({ ...cached[0].data, cached: true });
    }
    // Only a new area costs Geoapify credits, so only a new area counts against the daily allowance.
    // When the allowance is used up (or no key is set), the search still works with free
    // OpenStreetMap data only: Nominatim finds the city (≤1 request/s, cached here) and Overpass the places.
    const quota = GEO ? await db("rpc/maison_search_quota", "POST", { p_user: user }) : null;
    const full = !!(quota?.ok && (await quota.json()));
    let loc: any = null;
    if (full) {
      const geocode = new URL("https://api.geoapify.com/v1/geocode/search");
      geocode.search = new URLSearchParams({ text: city, type: "city", limit: "1", format: "json", apiKey: GEO! }).toString();
      const gr = await fetch(geocode, { signal: AbortSignal.timeout(6000) }).catch(() => null);
      if (gr?.ok) loc = (await gr.json()).results?.[0] || null;
    }
    if (!loc) loc = await nominatim(city, language);
    if (!loc) return json({ error: "We couldn't find that city. Try adding the country, for example “Mainz, Germany”." }, 404);
    if (!EUROPE.includes(loc.country_code)) return json({ error: "Please choose a European city." }, 400);

    const [geo, osm] = await Promise.all([
      full ? fromGeoapify(category, loc, language).catch(() => []) : Promise.resolve([]),
      fromOverpass(category, loc).catch(() => []),
    ]);
    const rows = merge(geo, osm);
    await addPhotos(rows);
    for (const r of rows) delete r.commons;
    const result = {
      rows,
      city: loc.city || loc.name || city,
      region: loc.country,
      lat: loc.lat,
      lng: loc.lon,
      sources: { geoapify: geo.length, openstreetmap: osm.length },
      attribution: "Powered by Geoapify · © OpenStreetMap contributors (ODbL)",
      cached: false,
    };
    // Store even small results so the same area is not fetched again for 30 days.
    await db("maison_discovery_cache?on_conflict=cache_key", "POST", {
      cache_key: key,
      data: result,
      // OpenStreetMap-only results are kept for a week, so the area gets the fuller search again later
      expires_at: new Date(Date.now() + (full ? CACHE_DAYS : 7) * 86400000).toISOString(),
    });
    return json(result);
  } catch {
    return json({ error: "Search is temporarily unavailable. Your shortlist is safe; try the directories below." }, 502);
  }
});
