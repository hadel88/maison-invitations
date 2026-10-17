// Finds the nearest larger European city (40,000+ inhabitants) to a position.
// Runs entirely in the browser: the position is never sent anywhere.
// City list: GeoNames (geonames.org, CC BY 4.0) via the all-the-cities package.
import cities from "./europeCities.json";

const rad = (d) => (d * Math.PI) / 180;
function km(aLat, aLon, bLat, bLon) {
  const dLat = rad(bLat - aLat);
  const dLon = rad(bLon - aLon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}
export function nearestCity(lat, lon, maxKm = 150) {
  let best = null;
  let bestKm = Infinity;
  for (const [name, cc, cLat, cLon] of cities) {
    const d = km(lat, lon, cLat, cLon);
    if (d < bestKm) {
      bestKm = d;
      best = [name, cc];
    }
  }
  if (!best || bestKm > maxKm) return null;
  let country = best[1];
  try {
    country = new Intl.DisplayNames(["en"], { type: "region" }).of(best[1]) || best[1];
  } catch {}
  return best[0] + ", " + country;
}
