/* 2 Hand Hold’em venues — one source for every map and venue list on the site.
   Live source of truth: the published Google My Maps list (MAP_MID). VENUES below is the
   offline fallback for the classic page's pins; keep it in step with the published map.
   Used by the classic page (js/locate-map.js), the 3D archive's Foundry exhibit
   (archive/app.js) and tools/build-exhibits.mjs, so it must stay DOM-free at import. */

export const MAP_MID = "1jkuOr8dbWp_1eP_5JAC2VYsHcoKf-Uc";
export const KML_URL = "https://www.google.com/maps/d/kml?mid=" + MAP_MID + "&forcekml=1";
export const VIEWER_URL = "https://www.google.com/maps/d/viewer?mid=" + MAP_MID;
export const EMBED_URL = "https://www.google.com/maps/d/embed?mid=" + MAP_MID;

/* West → east, matching the published My Maps folders. */
export const VENUES = [
  { name: "Silver Dollar Casino Seatac", region: "Washington", lat: 47.4301824, lon: -122.2947251 },
  { name: "Desert Bluffs Poker Room", region: "Washington", lat: 46.211844, lon: -119.1930494 },
  { name: "The Commerce Casino & Hotel", region: "California", lat: 33.9990952, lon: -118.1450002 },
  { name: "The Office Card House", region: "Texas", lat: 29.6603495, lon: -98.6290437 },
  { name: "Rustlers Club", region: "Texas", lat: 29.467311, lon: -98.6156977 },
];

/* Equirectangular CONUS bounds matching the classic page's silhouette (viewBox 0 0 1000 620). */
const LON_W = -125;
const LON_E = -66.5;
const LAT_N = 49.5;
const LAT_S = 24.5;

export function inConus(lon, lat) {
  return lon >= LON_W && lon <= LON_E && lat >= LAT_S && lat <= LAT_N;
}

/* Percent position on the 1000 × 620 plane. */
export function project(lon, lat) {
  const x = ((lon - LON_W) / (LON_E - LON_W)) * 100;
  const y = ((LAT_N - lat) / (LAT_N - LAT_S)) * 100;
  return { x: Math.max(1.5, Math.min(98.5, x)), y: Math.max(2, Math.min(96, y)) };
}

export function isFuture(name) {
  return /future|coming\s*soon|planned|tba|tbd/i.test(name || "");
}

export function shortLabel(name) {
  const raw = String(name || "").trim();
  if (!raw) return "Venue";
  return (
    raw
      .replace(/\s*&\s*Casino.*/i, "")
      .replace(/\s+Casino(\s*&\s*Hotel)?$/i, "")
      .replace(/\s+Resort(\s*&\s*Casino)?$/i, "")
      .replace(/\s+Poker\s+Room$/i, "")
      .replace(/\s+Card\s+House$/i, "")
      .trim() || raw
  );
}

function regionLabel(lon, lat) {
  if (lat >= 45 && lon <= -117) return "Washington";
  if (lat >= 35.2 && lat <= 37.5 && lon >= -116 && lon <= -114) return "Nevada";
  if (lat <= 42 && lon <= -114.1) return "California";
  if (lat <= 36.5 && lon >= -106.6 && lon <= -93.5) return "Texas";
  if (lon <= -100) return "West";
  if (lon <= -90) return "Central";
  return "East";
}

export function mapsHref(v) {
  return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(v.lat + "," + v.lon);
}

/* Adds plane position and display fields, sorted west → east. */
export function placeVenues(list) {
  return list
    .filter((v) => inConus(v.lon, v.lat))
    .map((v) => ({
      ...v,
      ...project(v.lon, v.lat),
      region: v.region || regionLabel(v.lon, v.lat),
      label: shortLabel(v.name),
      future: isFuture(v.name),
    }))
    .sort((a, b) => a.lon - b.lon || b.lat - a.lat);
}

/* Browser only (DOMParser). */
export function parseKml(xmlText) {
  const doc = new DOMParser().parseFromString(xmlText, "text/xml");
  if (doc.querySelector("parsererror")) return [];
  const out = [];
  for (const pm of doc.getElementsByTagName("Placemark")) {
    const name = (pm.getElementsByTagName("name")[0]?.textContent || "").trim();
    const coords = (pm.getElementsByTagName("coordinates")[0]?.textContent || "").trim();
    if (!name || !coords) continue;
    const [lonS, latS] = coords.split(/\s+/)[0].split(",");
    const lon = Number(lonS);
    const lat = Number(latS);
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;
    /* Prefer the My Maps folder name (California / Texas / …) when present */
    let region = "";
    for (let node = pm.parentElement; node; node = node.parentElement) {
      if (node.localName === "Folder") {
        region = (node.getElementsByTagName("name")[0]?.textContent || "").trim();
        break;
      }
    }
    out.push({ name, lat, lon, region });
  }
  return placeVenues(out);
}

/* One fetch per page. Resolves to { venues, source: "kml" | "fallback" } and never rejects. */
let pending = null;
export function loadVenues() {
  pending ||= (async () => {
    try {
      const res = await fetch(KML_URL, { credentials: "omit" });
      if (!res.ok) throw new Error("KML " + res.status);
      const venues = parseKml(await res.text());
      if (!venues.length) throw new Error("KML empty");
      return { venues, source: "kml" };
    } catch {
      return { venues: placeVenues(VENUES), source: "fallback" };
    }
  })();
  return pending;
}

/* The published My Maps map itself, small and lazy. Shared by the 3D archive and the static
   exhibit pages. `label` names the frame for screen readers. */
export function venueEmbedMarkup(label) {
  const t = String(label || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  return `<div class="venue-map"><iframe src="${EMBED_URL}" title="${t}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe></div>`;
}
