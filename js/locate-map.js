/* Locate — archive-plane pins driven by the published Google My Maps KML.
   Source of truth: mid=1jkuOr8dbWp_1eP_5JAC2VYsHcoKf-Uc
   New CONUS placemarks appear here automatically after Google publishes them. */

const MAP_MID = "1jkuOr8dbWp_1eP_5JAC2VYsHcoKf-Uc";
const KML_URL =
  "https://www.google.com/maps/d/kml?mid=" + MAP_MID + "&forcekml=1";
const VIEWER_URL =
  "https://www.google.com/maps/d/viewer?mid=" + MAP_MID;

/* Equirectangular CONUS bounds matching the hand-authored SVG silhouette */
const LON_W = -125;
const LON_E = -66.5;
const LAT_N = 49.5;
const LAT_S = 24.5;

function project(lon, lat) {
  const x = ((lon - LON_W) / (LON_E - LON_W)) * 100;
  const y = ((LAT_N - lat) / (LAT_N - LAT_S)) * 100;
  return {
    x: Math.max(1.5, Math.min(98.5, x)),
    y: Math.max(2, Math.min(96, y)),
  };
}

function inConus(lon, lat) {
  return lon >= LON_W && lon <= LON_E && lat >= LAT_S && lat <= LAT_N;
}

function isFuture(name) {
  return /future|coming\s*soon|planned|tba|tbd/i.test(name || "");
}

function shortLabel(name) {
  const raw = String(name || "").trim();
  if (!raw) return "Venue";
  return raw
    .replace(/\s*&\s*Casino.*/i, "")
    .replace(/\s+Casino(\s*&\s*Hotel)?$/i, "")
    .replace(/\s+Resort(\s*&\s*Casino)?$/i, "")
    .replace(/\s+Poker\s+Room$/i, "")
    .replace(/\s+Card\s+House$/i, "")
    .trim() || raw;
}

function regionLabel(lon, lat) {
  if (lat >= 45 && lon <= -121) return "Seattle";
  if (lat >= 45 && lon <= -117) return "Washington";
  if (lat >= 35.2 && lat <= 37.5 && lon >= -116 && lon <= -114) return "Las Vegas";
  if (lat <= 35 && lon <= -116.5) return "Los Angeles";
  if (lat <= 32 && lon >= -100.5 && lon <= -96.5) return "San Antonio";
  if (lat >= 40 && lon <= -120) return "Pacific NW";
  if (lon <= -115) return "West";
  if (lon <= -100) return "Mountain";
  if (lon <= -90) return "Central";
  return "East";
}

function parseKml(xmlText) {
  const doc = new DOMParser().parseFromString(xmlText, "text/xml");
  if (doc.querySelector("parsererror")) return [];

  const marks = [...doc.getElementsByTagName("Placemark")];
  const venues = [];

  for (const pm of marks) {
    const name = (pm.getElementsByTagName("name")[0]?.textContent || "").trim();
    const coordText = (
      pm.getElementsByTagName("coordinates")[0]?.textContent || ""
    ).trim();
    if (!name || !coordText) continue;

    const first = coordText.split(/\s+/)[0];
    const [lonS, latS] = first.split(",");
    const lon = Number(lonS);
    const lat = Number(latS);
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;
    if (!inConus(lon, lat)) continue;

    /* Prefer the My Maps folder name (Las Vegas / California / …) when present */
    let folder = "";
    let node = pm.parentElement;
    while (node) {
      if (node.localName === "Folder" || node.tagName === "Folder") {
        folder = (node.getElementsByTagName("name")[0]?.textContent || "").trim();
        break;
      }
      node = node.parentElement;
    }

    const { x, y } = project(lon, lat);
    venues.push({
      name,
      lon,
      lat,
      x,
      y,
      future: isFuture(name),
      region: folder || regionLabel(lon, lat),
      label: shortLabel(name),
    });
  }

  /* West → east so western labels stack first; stable for collision nudge */
  venues.sort((a, b) => a.lon - b.lon || b.lat - a.lat);
  nudgeCollisions(venues);
  return venues;
}

function nudgeCollisions(venues) {
  const MIN = 3.2;
  for (let i = 0; i < venues.length; i++) {
    for (let j = 0; j < i; j++) {
      const dx = venues[i].x - venues[j].x;
      const dy = venues[i].y - venues[j].y;
      if (Math.hypot(dx, dy) >= MIN) continue;
      venues[i].y = Math.min(96, venues[j].y + MIN);
      if (Math.abs(venues[i].x - venues[j].x) < 1.2) {
        venues[i].x = Math.min(98.5, venues[j].x + 1.4);
      }
    }
  }
}

function mapsHref(v) {
  return (
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent(v.lat + "," + v.lon)
  );
}

function renderPins(plane, venues) {
  plane.querySelectorAll(".locate-pin").forEach((el) => el.remove());

  for (const v of venues) {
    const a = document.createElement("a");
    a.className = "locate-pin" + (v.future ? " locate-pin--future" : "");
    if (v.x > 55) a.classList.add("locate-pin--east");
    a.style.setProperty("--pin-x", v.x.toFixed(2) + "%");
    a.style.setProperty("--pin-y", v.y.toFixed(2) + "%");
    a.href = mapsHref(v);
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.setAttribute(
      "aria-label",
      v.name + (v.future ? " — upcoming" : "") + " — open in Google Maps"
    );

    const dot = document.createElement("span");
    dot.className = "locate-pin-dot";
    dot.setAttribute("aria-hidden", "true");

    const label = document.createElement("span");
    label.className = "locate-pin-label mono";
    label.textContent = v.future ? "Future · " + v.label : v.label;

    a.append(dot, label);
    plane.appendChild(a);
  }
}

function renderList(list, venues) {
  if (!list) return;
  const certified = list.querySelector('[data-locate-static="certified"]');
  list.replaceChildren();
  if (certified) list.appendChild(certified);

  for (const v of venues) {
    const li = document.createElement("li");
    const key = document.createElement("span");
    key.textContent = v.future ? "Upcoming" : v.region;
    li.append(key, document.createTextNode(" " + v.name));
    list.appendChild(li);
  }
}

export async function initLocateMap() {
  const plane = document.querySelector(".locate-plane");
  const list = document.querySelector(".locate-venues");
  if (!plane) return;

  plane.dataset.locateMid = MAP_MID;
  plane.dataset.locateSource = "pending";

  try {
    const res = await fetch(KML_URL, { credentials: "omit" });
    if (!res.ok) throw new Error("KML " + res.status);
    const xml = await res.text();
    const venues = parseKml(xml);
    if (!venues.length) throw new Error("KML empty");

    renderPins(plane, venues);
    renderList(list, venues);
    plane.dataset.locateSource = "kml";
    plane.setAttribute(
      "aria-label",
      "Archive map of live 2 Hand Hold’em venues — " +
        venues.length +
        " pins from the published Google My Maps list"
    );
  } catch (_) {
    /* Keep the static HTML pins / list as the offline fallback */
    plane.dataset.locateSource = "fallback";
  }

  /* Ensure the full-map CTA still points at the same mid */
  document.querySelectorAll(".locate-ctas a[href*='maps/d/']").forEach((a) => {
    a.href = VIEWER_URL;
  });
}
