/* 2 Hand Hold’em venues — one source for every map and venue list on the site.
   Live source of truth: the published Google My Maps list (MAP_MID). VENUES below is the
   offline fallback and what the static exhibit pages are built from; keep it in step with
   the published map. Used by the classic page (js/locate-map.js), the 3D archive's Foundry
   exhibit (archive/app.js) and tools/build-exhibits.mjs, so it must stay DOM-free at import. */

export const MAP_MID = "1jkuOr8dbWp_1eP_5JAC2VYsHcoKf-Uc";
export const KML_URL = "https://www.google.com/maps/d/kml?mid=" + MAP_MID + "&forcekml=1";
export const VIEWER_URL = "https://www.google.com/maps/d/viewer?mid=" + MAP_MID;

/* West → east, matching the published My Maps folders. */
export const VENUES = [
  { name: "Silver Dollar Casino Seatac", region: "Washington", lat: 47.4301824, lon: -122.2947251 },
  { name: "Desert Bluffs Poker Room", region: "Washington", lat: 46.211844, lon: -119.1930494 },
  { name: "The Commerce Casino & Hotel", region: "California", lat: 33.9990952, lon: -118.1450002 },
  { name: "The Office Card House", region: "Texas", lat: 29.6603495, lon: -98.6290437 },
  { name: "Rustlers Club", region: "Texas", lat: 29.467311, lon: -98.6156977 },
];

/* Equirectangular CONUS bounds matching the hand-authored silhouette (viewBox 0 0 1000 620). */
const LON_W = -125;
const LON_E = -66.5;
const LAT_N = 49.5;
const LAT_S = 24.5;

export const CONUS_PATH =
  "M 4.3 38.2 L 34.5 23.8 L 258.6 23.8 L 517.2 23.8 L 620.7 47.7 L 706.9 83.5 L 793.1 155 L 844.8 131.2 L 931 119.2 L 1000 71.5 L 948.3 166.9 L 939.7 202.7 L 879.3 238.5 L 844.8 274.6 L 827.6 345.4 L 758.6 428.5 L 767.2 583.1 L 750 535.4 L 706.9 476.9 L 620.7 488.8 L 534.5 488.8 L 482.8 559.2 L 439.7 559.2 L 318.9 433.8 L 241.4 445.8 L 175.9 419.2 L 136.2 419.2 L 77.6 369.2 L 51.7 291.2 L 13.8 226.9 L 17.2 166.9 Z";

/* Every 10° of longitude and 5° of latitude. */
const GRID_X = [86.2, 258.6, 431, 603.4, 775.9, 948.3];
const GRID_Y = [119.2, 238.5, 357.7, 476.9, 596.2];

/* The outline as an SVG string, so the archive and the static pages draw the same country. */
export function outlineSvg(cls = "venue-map-svg") {
  const grid =
    GRID_X.map((x) => `<line x1="${x}" y1="0" x2="${x}" y2="620"/>`).join("") +
    GRID_Y.map((y) => `<line x1="0" y1="${y}" x2="1000" y2="${y}"/>`).join("");
  return `<svg class="${cls}" viewBox="0 0 1000 620" aria-hidden="true" focusable="false"><g class="venue-map-grid">${grid}</g><path class="venue-map-land" d="${CONUS_PATH}"/></svg>`;
}

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

/* Venues too close to tell apart on a small map share one marker. `gap` is in percent of the
   map width; y is scaled by the 620/1000 aspect so the distance is true on screen. */
export function groupVenues(venues, gap = 3) {
  const groups = [];
  venues.forEach((v, i) => {
    const near = groups.find((g) => Math.hypot(g.x - v.x, (g.y - v.y) * 0.62) < gap);
    if (near) {
      near.n.push(i + 1);
      near.x = (near.x * (near.n.length - 1) + v.x) / near.n.length;
      near.y = (near.y * (near.n.length - 1) + v.y) / near.n.length;
    } else groups.push({ x: v.x, y: v.y, n: [i + 1] });
  });
  return groups;
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

const escHtml = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/* Numbered map + matching list, as an HTML string. Shared by the 3D archive and the static
   exhibit pages. `s` carries the localized strings:
   { label, openIn: "{name} — open in Google Maps", fullMap, regions: { Texas: "…" } } */
export function venueMapMarkup(venues, s) {
  const region = (r) => escHtml(s.regions?.[r] || r);
  const pins = groupVenues(venues)
    .map(
      (g) =>
        `<span class="venue-pin${g.n.length > 1 ? " is-group" : ""}" data-n="${g.n.join(" ")}" style="left:${g.x.toFixed(2)}%;top:${g.y.toFixed(2)}%">${g.n.join("·")}</span>`
    )
    .join("");
  const rows = venues
    .map(
      (v, i) =>
        `<li data-n="${i + 1}"><span class="venue-n">${i + 1}</span><a href="${escHtml(mapsHref(v))}" target="_blank" rel="noopener noreferrer" aria-label="${escHtml(
          s.openIn.replace("{name}", v.name)
        )}">${escHtml(v.name)}</a><span class="venue-region">${region(v.region)}</span></li>`
    )
    .join("");
  return (
    `<div class="venue-map" role="img" aria-label="${escHtml(s.label)}">${outlineSvg()}${pins}</div>` +
    `<ol class="venue-list">${rows}</ol>` +
    `<p class="venue-more"><a href="${VIEWER_URL}" target="_blank" rel="noopener noreferrer">${escHtml(s.fullMap)} →</a></p>`
  );
}
