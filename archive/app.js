/* D22: The Living Archive — modes, HUD, exhibits, tour, and fallbacks around the 3D world. */
import { SECTORS, TOUR, ARTIFACTS, EMAIL } from "./content.js";
import { mountDemo } from "./holdem.js";

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const phoneMQ = matchMedia("(max-width: 760px)");
const STORE = "d22-living-archive";
const $ = (id) => document.getElementById(id);
const app = $("app");
const byId = (id) => SECTORS.find((s) => s.id === id);

let world = null;
let mode = "explore";
let current = null;
let tour = null;
let readoutFor = null;
let openTimer = 0;
let frameN = 0;

/* ---------- persistence ---------- */
const saved = (() => { try { return JSON.parse(localStorage.getItem(STORE) || "{}"); } catch { return {}; } })();
const foundArtifacts = new Set(saved.artifacts || []);
const visited = new Set(saved.visited || []);
function persist() {
  try { localStorage.setItem(STORE, JSON.stringify({ artifacts: [...foundArtifacts], visited: [...visited] })); } catch {}
}

/* ---------- small DOM helpers ---------- */
function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k === "text") el.textContent = v;
    else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const kid of kids.flat()) if (kid != null) el.append(kid);
  return el;
}
const ext = (href) => /^https?:/.test(href) ? { target: "_blank", rel: "noopener noreferrer" } : {};

/* ---------- exhibit blocks ---------- */
const BLOCKS = {
  gallery: (b) => h("div", { class: `gallery n${b.items.length}` }, b.items.map((it) =>
    h("figure", {},
      h("button", { type: "button", class: "zoomable", "aria-label": `Enlarge: ${it.alt}`, onclick: () => lightbox(it) },
        h("img", { src: it.src, alt: it.alt, loading: "lazy", decoding: "async", style: `object-position:${it.pos || "50% 50%"};object-fit:${it.fit || "cover"}` })),
      it.caption && h("figcaption", { text: it.caption })))),
  story: (b) => h("section", { class: "story" }, b.title && h("h3", { class: "sec mono", text: b.title }), b.text.map((t) => h("p", { text: t }))),
  quote: (b) => h("blockquote", { class: "quote" }, h("p", { text: b.text }), h("cite", { class: "mono", text: b.cite })),
  timeline: (b) => h("section", {}, b.title && h("h3", { class: "sec mono", text: b.title }),
    h("ol", { class: "timeline" }, b.items.map(([d, t, key]) => h("li", { class: key ? "key" : null }, h("span", { class: "mono", text: d }), h("span", { text: t }))))),
  facts: (b) => h("dl", { class: "facts" }, b.items.map(([k, v]) => h("div", {}, h("dt", { class: "mono", text: k }), h("dd", { text: v })))),
  links: (b) => h("section", {}, b.title && h("h3", { class: "sec mono", text: b.title }),
    h("p", { class: "links" }, b.items.map((l) => h("a", { href: l.href, ...ext(l.href), text: l.label })))),
  media: (b) => h("section", {}, h("h3", { class: "sec mono", text: b.title }),
    h("div", { class: "media" }, b.items.map((m) => h("a", { class: "media-card", href: m.href, ...ext(m.href) },
      h("span", { class: "thumb" }, h("img", { src: m.thumb, alt: "", loading: "lazy", onerror: (e) => e.target.remove() }), h("span", { class: "play", "aria-hidden": "true" })),
      h("span", { class: "media-text" }, h("strong", { text: m.title }), h("span", { text: m.source })))))),
  monitors: (b) => h("section", {}, h("h3", { class: "sec mono", text: b.title }),
    h("div", { class: "monitors" }, b.items.map((m, i) => h("a", { class: "monitor", href: m.href, ...ext(m.href), style: `--i:${i}` },
      h("span", { class: "mono ch", text: `CH ${String(i + 1).padStart(2, "0")}` }), h("strong", { text: m.title }), h("span", { class: "mono", text: m.source }))))),
  steps: (b) => h("section", {}, h("h3", { class: "sec mono", text: b.title }),
    h("ol", { class: "steps" }, b.items.map(([k, v]) => h("li", {}, h("strong", { text: k }), h("span", { text: v }))))),
  demo: () => { const el = h("section", { class: "demo" }); mountDemo(el); return el; },
  book: (b) => {
    const book = h("button", { type: "button", class: "book", "aria-label": "Open the book", "aria-pressed": "false" },
      h("span", { class: "book-inside" },
        h("span", { class: "mono", text: "Chapter one" }),
        h("strong", { text: "Because the most important bet you’ll ever make… is on you." }),
        h("span", { text: "Business decisions, poker, and the age of AI, from a Fortune 500 executive and a world champion." })),
      h("span", { class: "book-cover" }, h("img", { src: b.cover, alt: "Cover of Betting on Yourself by Joe Matton and Wayne Chiang" })));
    book.addEventListener("click", () => { const open = book.classList.toggle("open"); book.setAttribute("aria-pressed", String(open)); });
    return h("div", { class: "book-stage" }, book, h("p", { class: "mono hint-inline", text: "Tap the book to open it" }));
  },
  contact: () => {
    const status = h("span", { class: "mono copy-status", "aria-live": "polite" });
    const copy = h("button", { type: "button", class: "btn-ghost", text: "Copy email", onclick: async () => {
      try { await navigator.clipboard.writeText(EMAIL); status.textContent = "Copied"; }
      catch { getSelection().selectAllChildren(addr); status.textContent = "Selected. Press copy."; }
    } });
    const addr = h("strong", { class: "email", text: EMAIL });
    return h("section", { class: "contact" },
      h("p", { class: "mono eyebrow", text: "Primary business channel · licensing · press · talent" }),
      addr, h("p", { class: "contact-actions" }, h("a", { class: "btn-solid", href: `mailto:${EMAIL}`, text: "Email Wayne" }), copy, status));
  },
  downloads: (b) => h("section", {}, h("h3", { class: "sec mono", text: b.title }),
    h("ul", { class: "downloads" }, b.items.map((d) => h("li", {}, h("a", { href: d.href, download: true, text: d.label }))))),
};

function renderExhibitBody(s) {
  return s.exhibit.blocks.map((b) => BLOCKS[b.type](b));
}

/* ---------- lightbox ---------- */
function lightbox(it) {
  $("lightbox-img").src = it.src; $("lightbox-img").alt = it.alt; $("lightbox-cap").textContent = it.caption || it.alt;
  $("lightbox").hidden = false;
}
$("lightbox").addEventListener("click", () => ($("lightbox").hidden = true));

/* ---------- HUD ---------- */
const list = $("sector-list");
SECTORS.forEach((s, i) => {
  list.append(h("li", {}, h("button", { type: "button", "data-id": s.id, style: `--accent:${s.accent}`, onclick: () => go(s.id), onmouseenter: () => preview(s.id), onmouseleave: () => preview(null) },
    h("span", { class: "idx mono", text: String(i + 1).padStart(2, "0") }),
    h("span", { class: "nm" }, h("strong", { text: s.name.replace(/^The /, "") }), h("span", { class: "mono", text: s.era })))));
});
$("sector-count").textContent = String(SECTORS.length).padStart(2, "0");
$("art-total").textContent = ARTIFACTS.length;

function syncSectorList() {
  list.querySelectorAll("button").forEach((b) => {
    b.classList.toggle("active", b.dataset.id === current);
    b.classList.toggle("seen", visited.has(b.dataset.id));
  });
  $("art-count").textContent = foundArtifacts.size;
}

function setMode(m) {
  mode = m;
  app.dataset.mode = m;
  $("mode").textContent = { explore: "Exploration", travel: "Travel", exhibit: "Exhibit" }[m];
  $("view-name").textContent = m === "exhibit" && current ? byId(current).short : "World view";
}

function preview(id, kind = "sector") {
  readoutFor = id ? { id, kind } : null;
  const r = $("readout");
  if (!id || mode === "exhibit") { r.hidden = !current || mode === "exhibit"; if (current && mode !== "exhibit") fillReadout(byId(current)); return; }
  if (kind === "artifact") {
    const a = ARTIFACTS.find((x) => x.id === id);
    const found = foundArtifacts.has(id);
    $("readout-kicker").textContent = found ? "Artifact recovered" : "Unidentified artifact";
    $("readout-name").textContent = found ? a.title : "Signal detected";
    $("readout-tag").textContent = found ? "Click to read again" : "Click to send the scout";
    $("readout-go").hidden = true;
    r.style.setProperty("--accent", "#38bdf8");
    r.hidden = false;
    return;
  }
  fillReadout(byId(id));
  r.hidden = false;
}
function fillReadout(s) {
  $("readout-kicker").textContent = s.id === current ? "Command node selected" : "Destination";
  $("readout-name").textContent = s.name;
  $("readout-tag").textContent = s.tagline;
  $("readout-go").hidden = false;
  $("readout-go").onclick = () => go(s.id);
  $("readout").style.setProperty("--accent", s.accent);
}

/* ---------- labels over the world ---------- */
const labelsEl = $("labels");
const labels = SECTORS.map((s, i) => {
  const el = h("button", { type: "button", class: "label", style: `--accent:${s.accent}`, onclick: () => go(s.id), tabindex: "-1" },
    h("span", { class: "mono idx", text: String(i + 1).padStart(2, "0") }), h("strong", { text: s.short }), h("span", { class: "mono era", text: s.era }));
  labelsEl.append(el);
  return { s, el };
});
function placeLabels() {
  for (const { s, el } of labels) {
    const p = world.project("sector", s.id);
    el.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -100%)`;
    el.classList.toggle("on", readoutFor?.id === s.id || current === s.id);
  }
}

/* ---------- minimap ---------- */
const mm = $("minimap"), mctx = mm.getContext("2d");
function drawMinimap() {
  const st = world.state();
  const W = mm.width, c = W / 2, k = (W / 2 - 14) / st.R;
  const P = (x, z) => [c + x * k, c + z * k];
  mctx.clearRect(0, 0, W, W);
  mctx.fillStyle = "#101116"; mctx.beginPath(); mctx.arc(c, c, st.R * k, 0, 7); mctx.fill();
  mctx.strokeStyle = "rgba(232,196,74,.35)"; mctx.lineWidth = 2; mctx.stroke();
  mctx.strokeStyle = "rgba(232,196,74,.25)"; mctx.lineWidth = 3; mctx.beginPath(); mctx.arc(c, c, 10.5 * k, 0, 7); mctx.stroke();
  for (const s of st.sectors) {
    const [x, y] = P(s.x, s.z);
    mctx.strokeStyle = "rgba(232,196,74,.2)"; mctx.beginPath(); mctx.moveTo(c, c); mctx.lineTo(x, y); mctx.stroke();
    mctx.fillStyle = s.accent; mctx.globalAlpha = s.id === current ? 1 : 0.75;
    mctx.beginPath(); mctx.arc(x, y, s.id === current ? 15 : 11, 0, 7); mctx.fill();
    mctx.globalAlpha = 1;
  }
  for (const a of st.artifacts) {
    const [x, y] = P(a.x, a.z);
    mctx.fillStyle = a.found ? "#e8c44a" : "rgba(148,163,184,.45)";
    mctx.fillRect(x - 3, y - 3, 6, 6);
  }
  mctx.fillStyle = "#e8c44a"; mctx.beginPath(); mctx.arc(c, c, 5, 0, 7); mctx.fill();
  // View direction wedge from the camera target.
  const [tx, ty] = P(st.tx, st.tz);
  const dir = st.az + Math.PI;
  const vx = Math.sin(dir), vy = Math.cos(dir);
  const len = 60 / Math.sqrt(st.zoom);
  mctx.fillStyle = "rgba(255,255,255,.08)"; mctx.strokeStyle = "rgba(255,255,255,.55)"; mctx.lineWidth = 1.5;
  mctx.beginPath(); mctx.moveTo(tx - vx * len * 0.6, ty - vy * len * 0.6);
  mctx.lineTo(tx + vx * len - vy * len * 0.6, ty + vy * len + vx * len * 0.6);
  mctx.lineTo(tx + vx * len + vy * len * 0.6, ty + vy * len - vx * len * 0.6);
  mctx.closePath(); mctx.fill(); mctx.stroke();
  const [sx, sy] = P(st.scout.x, st.scout.z);
  mctx.fillStyle = "#86efac"; mctx.beginPath(); mctx.arc(sx, sy, 6, 0, 7); mctx.fill();
}
mm.addEventListener("click", (e) => {
  if (!world) return;
  const st = world.state(), r = mm.getBoundingClientRect();
  const k = (mm.width / 2 - 14) / st.R, sc = mm.width / r.width;
  world.lookAt(((e.clientX - r.left) * sc - mm.width / 2) / k, ((e.clientY - r.top) * sc - mm.width / 2) / k);
});

/* ---------- modes ---------- */
function framing() {
  return phoneMQ.matches ? { shiftX: 0, shiftY: 0.3, zoom: 1.9 } : { shiftX: -0.24, shiftY: 0, zoom: 2.3 };
}

function go(id, { fromTour = false, instant = false } = {}) {
  const s = byId(id);
  if (!s) return;
  if (!fromTour) tour = null;
  current = id;
  clearTimeout(openTimer);
  if (!world) { openExhibit(s); return; }
  world.setSelected(id);
  world.setIdleSpin(false);
  world.sendScoutToSector(id, () => world.setSelected(id));
  world.focusSector(id, framing());
  setMode("travel");
  syncSectorList();
  preview(id);
  // Never make the visitor wait on the scout: the exhibit opens once the camera has arrived.
  openTimer = setTimeout(() => openExhibit(s), instant || reduced ? 0 : 950);
}

function openExhibit(s) {
  current = s.id;
  visited.add(s.id); persist();
  setMode("exhibit");
  $("readout").hidden = true;
  const ex = s.exhibit;
  const ix = SECTORS.indexOf(s);
  $("exhibit").style.setProperty("--accent", s.accent);
  $("ex-crumb").textContent = `Sector ${String(ix + 1).padStart(2, "0")} · ${s.name}`;
  $("ex-kicker").textContent = ex.kicker;
  $("ex-title").textContent = ex.title;
  $("ex-lede").textContent = ex.lede;
  $("ex-body").replaceChildren(...renderExhibitBody(s));
  $("ex-foot").replaceChildren(footer(s));
  $("exhibit").hidden = false;
  $("ex-scroll").scrollTop = 0;
  requestAnimationFrame(() => $("exhibit").classList.add("open"));
  if (location.hash !== `#${s.id}`) history.replaceState(null, "", `#${s.id}`);
  document.title = `${s.name} · D22: The Living Archive`;
  syncSectorList();
  if (world) { world.frame(framing()); world.setBackground("exhibit"); }
}

function footer(s) {
  const ix = SECTORS.indexOf(s);
  if (tour != null) {
    const pos = TOUR.indexOf(s.id);
    const next = TOUR[pos + 1] && byId(TOUR[pos + 1]);
    return h("div", { class: "tour-foot" },
      h("p", { class: "mono eyebrow", text: `Guided tour · stop ${pos + 1} of ${TOUR.length}` }),
      h("div", { class: "foot-actions" },
        next ? h("button", { type: "button", class: "btn-solid", onclick: () => go(next.id, { fromTour: true }), text: `Next stop: ${next.name} →` })
             : h("button", { type: "button", class: "btn-solid", onclick: () => { tour = null; closeExhibit(); }, text: "Finish the tour" }),
        h("button", { type: "button", class: "btn-ghost", onclick: () => { tour = null; $("ex-foot").replaceChildren(footer(s)); }, text: "Leave tour" })));
  }
  const prev = SECTORS[(ix + SECTORS.length - 1) % SECTORS.length], next = SECTORS[(ix + 1) % SECTORS.length];
  return h("div", { class: "foot-actions spread" },
    h("button", { type: "button", class: "btn-ghost", onclick: () => go(prev.id), text: `← ${prev.short}` }),
    h("button", { type: "button", class: "btn-ghost", onclick: closeExhibit, text: "Back to the world" }),
    h("button", { type: "button", class: "btn-ghost", onclick: () => go(next.id), text: `${next.short} →` }));
}

function closeExhibit() {
  clearTimeout(openTimer);
  $("exhibit").classList.remove("open");
  setTimeout(() => { if (!$("exhibit").classList.contains("open")) $("exhibit").hidden = true; }, 280);
  setMode("explore");
  if (location.hash) history.replaceState(null, "", location.pathname + location.search);
  document.title = "D22: The Living Archive";
  if (world) { world.frame({ shiftX: 0, shiftY: 0 }); world.zoomBy(0.6); world.setIdleSpin(true); world.setBackground("none"); }
  preview(null);
}

function deselect() {
  current = null;
  world?.setSelected(null);
  $("readout").hidden = true;
  syncSectorList();
}

/* ---------- tour ---------- */
$("tour-btn").addEventListener("click", () => { tour = 0; closeList(); go(TOUR[0], { fromTour: true }); });

/* ---------- list view (also the no-WebGL / small-screen alternative) ---------- */
function buildList() {
  $("list-nav").replaceChildren(...SECTORS.map((s, i) => h("a", { href: `#list-${s.id}`, style: `--accent:${s.accent}`, onclick: (e) => { e.preventDefault(); document.getElementById(`list-${s.id}`).scrollIntoView({ behavior: reduced ? "auto" : "smooth" }); }, text: `${String(i + 1).padStart(2, "0")} ${s.short}` })));
  $("list-body").replaceChildren(...SECTORS.map((s) => h("article", { class: "list-ex", id: `list-${s.id}`, style: `--accent:${s.accent}` },
    h("p", { class: "kicker mono", text: `${s.exhibit.kicker} · ${s.era}` }),
    h("h2", { text: s.name }),
    h("p", { class: "lede", text: s.exhibit.lede }),
    renderExhibitBody(s))));
}
let listBuilt = false;
function openList() {
  if (!listBuilt) { buildList(); listBuilt = true; }
  $("list-view").hidden = false;
  app.classList.add("listing");
  world?.setBackground("list");
}
function closeList() {
  if (!world) return;
  $("list-view").hidden = true;
  app.classList.remove("listing");
  world.setBackground(mode === "exhibit" ? "exhibit" : "none");
}
$("list-btn").addEventListener("click", openList);
$("list-close").addEventListener("click", closeList);

/* ---------- artifacts ---------- */
let toastTimer = 0;
function showArtifact(a) {
  $("toast-title").textContent = a.title;
  $("toast-text").textContent = a.text;
  const t = $("toast");
  t.hidden = false;
  requestAnimationFrame(() => t.classList.add("open"));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.classList.remove("open"); setTimeout(() => (t.hidden = true), 300); }, 7000);
}
$("toast").addEventListener("click", () => { $("toast").classList.remove("open"); setTimeout(() => ($("toast").hidden = true), 300); });

/* ---------- keyboard ---------- */
addEventListener("keydown", (e) => {
  if (e.target.closest?.("input,textarea")) return;
  if (e.key === "Escape") {
    if (!$("lightbox").hidden) { $("lightbox").hidden = true; return; }
    if (!$("list-view").hidden && world) { closeList(); return; }
    if (mode !== "explore") closeExhibit();
    return;
  }
  if (!world || !$("list-view").hidden || e.target.closest?.(".exhibit")) return;
  const n = Number(e.key);
  if (n >= 1 && n <= SECTORS.length) go(SECTORS[n - 1].id);
  else if (e.key === "ArrowLeft") world.rotateBy(0.25);
  else if (e.key === "ArrowRight") world.rotateBy(-0.25);
  else if (e.key === "+" || e.key === "=") world.zoomBy(1.25);
  else if (e.key === "-") world.zoomBy(0.8);
});
$("zoom-in").addEventListener("click", () => world?.zoomBy(1.3));
$("zoom-out").addEventListener("click", () => world?.zoomBy(0.77));
$("ex-close").addEventListener("click", closeExhibit);
$("home-link").addEventListener("click", (e) => { e.preventDefault(); closeList(); if (mode !== "explore") closeExhibit(); deselect(); world?.overview(); });
$("media-btn").addEventListener("click", (e) => { e.preventDefault(); closeList(); go("command", { instant: true }); });

/* ---------- boot ---------- */
function route() {
  const id = location.hash.slice(1);
  if (id === "list") openList();
  else if (byId(id)) go(id, { instant: true });
}

async function boot() {
  const { createWorld, webglAvailable } = await import("./world.js").catch(() => ({}));
  if (!createWorld || !webglAvailable()) {
    app.classList.add("no-webgl");
    $("loading").remove();
    openList();
    return;
  }
  try {
    world = createWorld({
      canvas: $("world"), sectors: SECTORS, artifacts: ARTIFACTS, reduced,
      onHover: (hit) => { preview(hit ? hit.id : null, hit?.type); },
      onClick: (hit) => {
        if (!hit) { if (mode === "explore") deselect(); return; }
        if (hit.type === "sector") go(hit.id);
        else {
          const a = ARTIFACTS.find((x) => x.id === hit.id);
          if (foundArtifacts.has(a.id)) showArtifact(a);
          else { world.sendScoutToArtifact(a.id); $("hint").textContent = "Scout dispatched to the signal…"; }
        }
      },
      onCameraUser: () => app.classList.add("touched"),
      onFrame: () => { if (!world) return; placeLabels(); if (frameN++ % 3 === 0) drawMinimap(); },
    });
  } catch (err) {
    console.error(err);
    app.classList.add("no-webgl");
    $("loading").remove();
    openList();
    return;
  }
  world.restoreFound([...foundArtifacts]);
  world.onDiscover((a) => {
    if (foundArtifacts.has(a.id)) return;
    foundArtifacts.add(a.id); persist(); syncSectorList();
    showArtifact(a);
    $("hint").textContent = foundArtifacts.size === ARTIFACTS.length ? "Every artifact recovered." : "Drag to rotate · Scroll to zoom · Click a destination";
  });
  if (matchMedia("(pointer: coarse)").matches) $("hint").textContent = "Drag to rotate · Pinch to zoom · Tap a destination";
  syncSectorList();
  $("loading").classList.add("done");
  setTimeout(() => $("loading").remove(), 600);
  route();
}
addEventListener("hashchange", () => { const id = location.hash.slice(1); if (byId(id) && id !== current) go(id); else if (id === "list") openList(); });
boot();
