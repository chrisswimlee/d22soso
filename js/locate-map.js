/* Locate — archive-plane pins driven by the published Google My Maps KML.
   Data, projection and the KML reader live in ./venues.js (shared with the 3D archive).
   New CONUS placemarks appear here automatically after Google publishes them. */
import { MAP_MID, VIEWER_URL, mapsHref, loadVenues } from "./venues.js";

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

/* Labels are wider than dot spacing allows on small maps (LA and Las Vegas
   sit a few px apart on a phone). Measure the real labels and, for any that
   lands on an earlier one, try the other side of its pin, then above, then
   below; keep the default if nothing is clear. */
const LABEL_MOVES = ["locate-pin--flip", "locate-pin--above", "locate-pin--below"];

function untangleLabels(plane) {
  const pins = [...plane.querySelectorAll(".locate-pin")];
  if (!pins.length) return;
  plane.classList.add("is-measuring");
  pins.forEach((pin) => pin.classList.remove(...LABEL_MOVES));
  const bounds = plane.getBoundingClientRect();
  const placed = [];
  const clear = (r) =>
    r.left >= bounds.left - 1 &&
    r.right <= bounds.right + 1 &&
    !placed.some((q) => r.left < q.right - 2 && r.right > q.left + 2 && r.top < q.bottom - 2 && r.bottom > q.top + 2);

  for (const pin of pins) {
    const label = pin.querySelector(".locate-pin-label");
    if (!label) continue;
    let chosen = clear(label.getBoundingClientRect()) ? "" : null;
    for (const move of LABEL_MOVES) {
      if (chosen !== null) break;
      pin.classList.add(move);
      if (clear(label.getBoundingClientRect())) chosen = move;
      else pin.classList.remove(move);
    }
    placed.push(label.getBoundingClientRect());
  }
  plane.classList.remove("is-measuring");
}

function watchLabels(plane) {
  untangleLabels(plane);
  if (!("ResizeObserver" in window)) return;
  let frame = 0;
  new ResizeObserver(() => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => untangleLabels(plane));
  }).observe(plane);
}

/* Lede names the live venues so it never drifts from the map */
function renderLede(lede, venues) {
  if (!lede) return;
  const live = venues.filter((v) => !v.future).map((v) => v.label);
  if (!live.length) return;
  const names =
    live.length === 1
      ? live[0]
      : live.slice(0, -1).join(", ") + (live.length > 2 ? "," : "") + " and " + live[live.length - 1];
  lede.textContent = "Live now at " + names + ".";
}

export async function initLocateMap() {
  const plane = document.querySelector(".locate-plane");
  const list = document.querySelector(".locate-venues");
  if (!plane) return;

  plane.dataset.locateMid = MAP_MID;
  plane.dataset.locateSource = "pending";
  watchLabels(plane);

  const { venues: placed, source } = await loadVenues();
  if (source === "kml") {
    /* Copies: the shared list is reused by other views; the nudge below moves pins. */
    const venues = placed.map((v) => ({ ...v }));
    nudgeCollisions(venues);
    renderPins(plane, venues);
    untangleLabels(plane);
    renderList(list, venues);
    renderLede(document.querySelector("#locate .lede"), venues);
    plane.setAttribute(
      "aria-label",
      "Archive map of live 2 Hand Hold’em venues — " +
        venues.length +
        " pins from the published Google My Maps list"
    );
  }
  /* On "fallback" the static HTML pins and list stay as they are. */
  plane.dataset.locateSource = source;

  /* Ensure the full-map CTA still points at the same mid */
  document.querySelectorAll(".locate-ctas a[href*='maps/d/']").forEach((a) => {
    a.href = VIEWER_URL;
  });
}
