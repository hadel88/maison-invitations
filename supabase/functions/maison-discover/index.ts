
const SB=Deno.env.get("SUPABASE_URL")!;
const ADMIN=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GEO=Deno.env.get("GEOAPIFY_API_KEY");
const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});
async function db(path:string,method="GET",body?:unknown){return fetch(SB+"/rest/v1/"+path,{method,headers:{apikey:ADMIN,Authorization:"Bearer "+ADMIN,"Content-Type":"application/json",Prefer:"resolution=merge-duplicates"},...(body?{body:JSON.stringify(body)}:{})})}
const categories:Record<string,string>={venues:"accommodation.hotel,tourism.sights.conference_centre,activity.community_center",flowers:"commercial.florist",cakes:"commercial.food_and_drink.bakery,catering.cafe.cake",beauty:"service.beauty",dining:"catering.restaurant"};
const safe=(value:unknown,max=300)=>String(value??"").replace(/\s+/g," ").trim().slice(0,max);
const website=(v:unknown)=>{try{const u=new URL(String(v));return ["https:","http:"].includes(u.protocol)?u.href:null}catch{return null}};
Deno.serve(async(req:Request)=>{
 const urlInfo=new URL(req.url);const demo=req.method==="GET"&&urlInfo.searchParams.get("demo")==="1";
 if(req.method==="GET"&&urlInfo.searchParams.get("health")==="1")return json({configured:!!GEO,provider:"Geoapify"});
 if(req.method!=="POST"&&!demo)return json({error:"Method not allowed"},405);
 try{
  let user:any;let body:any;
  if(demo){user={id:"00000000-0000-4000-8000-000000000001"};body={city:"Frankfurt, Germany",category:"venues",language:"en"}}
  else{const auth=req.headers.get("Authorization")||"";
  const ur=await fetch(SB+"/auth/v1/user",{headers:{Authorization:auth,apikey:Deno.env.get("SUPABASE_ANON_KEY")!}});
  if(!ur.ok)return json({error:"Sign in to search local experts."},401);
  user=await ur.json();body=await req.json();}const city=safe(body.city,80),category=String(body.category||"venues"),language=["en","de","fr"].includes(body.language)?body.language:"en";
  if(body.health)return json({configured:!!GEO,provider:"Geoapify"});
  if(!GEO)return json({error:"The existing Geoapify key is not configured in this Supabase project. Official discovery directories are available below.",configured:false},503);
  if(city.length<2||!categories[category])return json({error:"Choose a city and a supported search category."},400);
  const key="v1:"+city.toLowerCase()+":"+category+":"+language;
  const cache=await db("maison_discovery_cache?cache_key=eq."+encodeURIComponent(key)+"&expires_at=gt."+encodeURIComponent(new Date().toISOString())+"&select=data");
  if(cache.ok){const cached=await cache.json();if(cached[0])return json({...cached[0].data,cached:true})}
  const quota=await db("rpc/maison_search_quota","POST",{p_user:user.id});if(!quota.ok||!(await quota.json()))return json({error:"The search allowance has been reached. Try saved results or the official directories below.",limited:true},429);
  const geocode=new URL("https://api.geoapify.com/v1/geocode/search");geocode.search=new URLSearchParams({text:city,type:"city",limit:"1",format:"json",apiKey:GEO}).toString();
  const gr=await fetch(geocode,{signal:AbortSignal.timeout(10000)});if(!gr.ok)return json({error:"City search is temporarily unavailable. Please try again later."},502);
  const loc=(await gr.json()).results?.[0];if(!loc)return json({error:"We couldn't find that city. Try adding the country."},404);
  if(!["de","fr","gb","ie","it","es","pt","at","ch","nl","be","lu","dk","se","no","fi","pl","cz","gr","hu","ro","hr","si","sk","ee","lv","lt","is","mt","cy","bg"].includes(loc.country_code))return json({error:"Please choose a European city for this preview."},400);
  const url=new URL("https://api.geoapify.com/v2/places");url.search=new URLSearchParams({categories:categories[category],filter:"circle:"+loc.lon+","+loc.lat+",12000",bias:"proximity:"+loc.lon+","+loc.lat,limit:"40",lang:language,apiKey:GEO}).toString();
  const r=await fetch(url,{signal:AbortSignal.timeout(12000)});if(!r.ok)return json({error:"Local place search is temporarily unavailable. Use the official directories below while we reconnect."},502);
  const data=await r.json();const rows=(data.features||[]).map((f:any)=>{const p=f.properties||{},raw=p.datasource?.raw||{};return {id:p.place_id,name:safe(p.name,160),address:safe(p.formatted,350),website:website(p.website||raw.website||raw["contact:website"]),phone:safe(p.contact?.phone||raw.phone||raw["contact:phone"],60),lat:p.lat,lng:p.lon,category,distance:p.distance?Math.round(p.distance):null,source:"Geoapify / OpenStreetMap"}}).filter((p:any)=>p.name&&p.id);
  const result={rows,city:loc.city||loc.name||city,region:loc.country,lat:loc.lat,lng:loc.lon,attribution:"Powered by Geoapify · © OpenStreetMap contributors",cached:false};
  await db("maison_discovery_cache?on_conflict=cache_key","POST",{cache_key:key,data:result,expires_at:new Date(Date.now()+7*86400000).toISOString()});
  return json(result);
 }catch{return json({error:"Search is temporarily unavailable. Your shortlist is safe; try the official directories below."},502)}
});
