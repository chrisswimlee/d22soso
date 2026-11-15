/* D22: The Living Archive — modes, HUD, exhibits, tour, and fallbacks around the 3D world. */
import { SECTORS as BASE_SECTORS, TOUR, CHRONO, ARTIFACTS as BASE_ARTIFACTS, EMAIL } from "./content.js?v=19";
import { play, setSound, soundOn } from "./sound.js?v=1";
import { mountDemo } from "./holdem.js?v=2";
import { LOCALES, UI, detectLocale, persistLocale, makeT, localizeSectors, localizeArtifacts } from "./i18n.js?v=9";

/* ---------- localisation (EN source, KO / ZH overlays from i18n.js) ---------- */
let locale = detectLocale();
try { if (new URLSearchParams(location.search).get("lang")) persistLocale(locale); } catch {}
let t = makeT(locale);
let SECTORS = localizeSectors(BASE_SECTORS, locale);
let ARTIFACTS = localizeArtifacts(BASE_ARTIFACTS, locale);
const holdemStrings = () => (UI[locale] || UI.en).holdem;

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
let wasUnder = false;

/* ---------- persistence ---------- */
const saved = (() => { try { return JSON.parse(localStorage.getItem(STORE) || "{}"); } catch { return {}; } })();
const foundArtifacts = new Set(saved.artifacts || []);
const visited = new Set(saved.visited || []);
// How far down each exhibit the visitor has read, 0–1. Feeds the bars under the sign names and in the sector list.
const read = saved.read && typeof saved.read === "object" ? saved.read : {};
const SURFACE = ARTIFACTS.filter((a) => !a.under);
const surfaceFound = () => SURFACE.reduce((n, a) => n + (foundArtifacts.has(a.id) ? 1 : 0), 0);
const buriedLeft = () => ARTIFACTS.some((a) => a.under && !foundArtifacts.has(a.id));
/* ---------- progress: reading per exhibit, artifacts per sector ---------- */
const readPct = (id) => Math.round(Math.min(1, read[id] || 0) * 100);
const sectorArtifacts = (id) => ARTIFACTS.filter((a) => a.sector === id);
function syncProgress() {
  for (const l of labels) {
    l.bar.style.setProperty("--p", `${readPct(l.s.id)}%`);
    l.bar.classList.toggle("full", readPct(l.s.id) >= 100);
  }
  list.querySelectorAll("button[data-id]").forEach((b) => {
    const id = b.dataset.id, arts = sectorArtifacts(id), found = arts.filter((a) => foundArtifacts.has(a.id)).length;
    const pct = readPct(id);
    b.style.setProperty("--p", `${pct}%`);
    // "◆ 1/3" on screen; screen readers hear the word "Artifacts" instead of the symbol.
    b.querySelector(".prog").replaceChildren(t("explored", { n: pct }), ...(arts.length ? [" · ",
      h("span", { "aria-hidden": "true", text: "◆ " }), h("span", { class: "sr-only", text: `${t("artifacts")} ` }), `${found}/${arts.length}`] : []));
  });
  if (current && mode === "exhibit") $("ex-progress").style.setProperty("--p", `${readPct(current)}%`);
}
function markRead() {
  if (!current || mode !== "exhibit") return;
  const el = $("ex-scroll");
  const f = el.scrollHeight <= el.clientHeight + 4 ? 1 : (el.scrollTop + el.clientHeight) / el.scrollHeight;
  const v = f > 0.97 ? 1 : f;
  if (v > (read[current] || 0) + 0.01 || (v === 1 && read[current] !== 1)) { read[current] = Math.round(v * 100) / 100; persist(); syncProgress(); }
}
function persist() {
  try { localStorage.setItem(STORE, JSON.stringify({ artifacts: [...foundArtifacts], visited: [...visited], read })); } catch {}
}

/* ---------- small DOM helpers ---------- */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k === "text") el.textContent = v;
    else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid);
  return el;
}
const ext = (href) => /^https?:/.test(href) ? { target: "_blank", rel: "noopener noreferrer" } : {};

/* ---------- exhibit blocks ---------- */
const BLOCKS = {
  gallery: (b) => h("div", { class: `gallery n${b.items.length}` }, b.items.map((it) =>
    h("figure", { class: it.rounds ? "has-path" : "" },
      it.rounds && h("ol", { class: "path" }, it.rounds.map((name, i, arr) =>
        h("li", { class: i === arr.length - 1 ? "key" : "" }, h("span", { text: name })))),
      it.rounds
        ? h("button", { type: "button", class: "path-source", onclick: () => lightbox(it), text: it.caption })
        : h("button", { type: "button", class: ["zoomable", it.hero ? "hero" : "", it.fit === "contain" ? "contain" : ""].filter(Boolean).join(" "), "aria-label": t("enlarge", { alt: it.alt }), onclick: () => lightbox(it) },
          h("img", { src: it.src, alt: it.alt, loading: "lazy", decoding: "async", style: `object-position:${it.pos || "50% 50%"};object-fit:${it.fit || "cover"}` })),
      !it.rounds && it.caption && h("figcaption", { text: it.caption })))),
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
  demo: () => { const el = h("section", { class: "demo" }); mountDemo(el, holdemStrings()); return el; },
  book: (b) => {
    const book = h("button", { type: "button", class: "book", "aria-label": t("openBook"), "aria-pressed": "false" },
      h("span", { class: "book-inside" },
        h("span", { class: "mono", text: t("chapterOne") }),
        h("strong", { text: t("bookQuote") }),
        h("span", { text: t("bookDesc") })),
      h("span", { class: "book-cover" }, h("img", { src: b.cover, alt: t("bookCoverAlt") })));
    book.addEventListener("click", () => { const open = book.classList.toggle("open"); book.setAttribute("aria-pressed", String(open)); });
    return h("div", { class: "book-stage" }, book, h("p", { class: "mono hint-inline", text: t("tapBook") }));
  },
  contact: () => {
    const status = h("span", { class: "mono copy-status", "aria-live": "polite" });
    const copy = h("button", { type: "button", class: "btn-ghost", text: t("copyEmail"), onclick: async () => {
      try { await navigator.clipboard.writeText(EMAIL); status.textContent = t("copied"); }
      catch { getSelection().selectAllChildren(addr); status.textContent = t("selectedCopy"); }
    } });
    const addr = h("strong", { class: "email", text: EMAIL });
    return h("section", { class: "contact" },
      h("p", { class: "mono eyebrow", text: t("contactEyebrow") }),
      addr, h("p", { class: "contact-actions" }, h("a", { class: "btn-solid", href: `mailto:${EMAIL}`, text: t("emailWayne") }), copy, status));
  },
  downloads: (b) => h("section", {}, h("h3", { class: "sec mono", text: b.title }),
    h("ul", { class: "downloads" }, b.items.map((d) => h("li", {}, h("a", { href: d.href, download: true, text: d.label }))))),
};

function renderExhibitBody(s) {
  return s.exhibit.blocks.map((b) => BLOCKS[b.type](b));
}

/* ---------- lightbox ---------- */
let lightboxFrom = null;
function closeLightbox() {
  $("lightbox").hidden = true;
  lightboxFrom?.focus({ preventScroll: true });
}
function lightbox(it) {
  $("lightbox-img").src = it.src; $("lightbox-img").alt = it.alt; $("lightbox-cap").textContent = it.caption || it.alt;
  lightboxFrom = document.activeElement;
  $("lightbox").hidden = false;
  $("lightbox-close").focus();
}
$("lightbox").addEventListener("click", closeLightbox);

/* ---------- HUD ---------- */
const list = $("sector-list");
function buildSectorList() {
  list.replaceChildren(...SECTORS.map((s, i) =>
    h("li", {}, h("button", { type: "button", "data-id": s.id, style: `--accent:${s.accent}`, onclick: () => go(s.id), onmouseenter: () => preview(s.id), onmouseleave: () => preview(null) },
      h("span", { class: "idx mono", text: String(i + 1).padStart(2, "0") }),
      h("span", { class: "nm" }, h("strong", { text: s.name.replace(/^The /, "") }), h("span", { class: "mono", text: s.era }),
        h("span", { class: "prog mono" })),
      h("span", { class: "bar", "aria-hidden": "true" })))));
}
buildSectorList();
$("sector-count").textContent = String(SECTORS.length).padStart(2, "0");
$("art-total").textContent = SURFACE.length;
$("finds-hint").textContent = t("findsHint", { n: SURFACE.length });

function shownSelection() {
  if (mode !== "explore") return current;
  return readoutFor?.kind === "sector" ? readoutFor.id : null;
}
function syncSectorList() {
  const sel = shownSelection();
  list.querySelectorAll("button").forEach((b) => {
    b.classList.toggle("active", b.dataset.id === sel);
    if (b.dataset.id === sel) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current");
    b.classList.toggle("seen", visited.has(b.dataset.id));
  });
  $("art-count").textContent = surfaceFound();
  $("finds-hint").hidden = surfaceFound() >= SURFACE.length;
}

function setMode(m) {
  mode = m;
  app.dataset.mode = m;
  headerH = 0;
  $("mode").textContent = { explore: t("exploration"), travel: t("travel"), exhibit: t("exhibitMode") }[m];
  $("view-name").textContent = m === "exhibit" && current ? byId(current).short : t("worldView");
  if (m === "explore") flushToast();
  else hideToast();
}

function hideReadout() {
  readoutFor = null;
  $("readout").hidden = true;
}
function preview(id, kind = "sector") {
  const r = $("readout");
  // One sector is lit at a time. Hover previews it; travel and the open exhibit keep the committed one.
  if (mode !== "explore" || !id) {
    hideReadout();
    if (mode === "explore") world?.setHighlight(null);
    syncSectorList();
    return;
  }
  readoutFor = { id, kind };
  if (kind === "artifact") {
    const a = ARTIFACTS.find((x) => x.id === id);
    const found = foundArtifacts.has(id);
    $("readout-kicker").textContent = found ? t("artifactRecovered") : t("unidentifiedArtifact");
    $("readout-name").textContent = found ? a.title : t("signalDetected");
    $("readout-tag").textContent = found ? t("clickReadAgain") : a.under ? t("clickRecover") : t("clickSendScout");
    $("readout-go").hidden = true;
    r.style.setProperty("--accent", "#38bdf8");
    r.hidden = false;
    world?.setHighlight(null);
    syncSectorList();
    return;
  }
  const s = byId(id);
  if (!s) { hideReadout(); world?.setHighlight(null); syncSectorList(); return; }
  fillReadout(s);
  r.hidden = false;
  world?.setHighlight(id);
  syncSectorList();
}
function fillReadout(s) {
  $("readout-kicker").textContent = s.id === current ? s.short : t("destination");
  $("readout-name").textContent = s.name;
  $("readout-tag").textContent = s.tagline;
  $("readout-go").hidden = false;
  $("readout-go").onclick = () => go(s.id);
  $("readout").style.setProperty("--accent", s.accent);
}

/* ---------- labels over the world ---------- */
const labelsEl = $("labels");
let labels = [];
function buildLabels() {
  labelsEl.replaceChildren();
  labels = SECTORS.map((s, i) => {
    const el = h("button", { type: "button", class: "label off", tabindex: "-1", style: `--accent:${s.accent}`, onclick: () => go(s.id), onmouseenter: () => preview(s.id), onmouseleave: () => preview(null) },
      h("span", { class: "mono idx", text: String(i + 1).padStart(2, "0") }), h("strong", { text: s.short }));
    const bar = h("span", { class: "bar" });
    el.append(bar);
    labelsEl.append(el);
    return { s, el, bar, at: "", on: false, z: "", w: 0, h: 0, hide: true };
  });
}
buildLabels();
syncProgress();
let headerH = 0;
let sat = 0;
let frameTimer = 0;
function measureSat() {
  const prev = app.style.paddingTop;
  app.style.paddingTop = "env(safe-area-inset-top, 0px)";
  sat = parseFloat(getComputedStyle(app).paddingTop) || 0;
  app.style.paddingTop = prev;
}
measureSat();
addEventListener("resize", () => {
  labels.forEach((l) => (l.w = 0));
  headerH = 0;
  measureSat();
  clearTimeout(frameTimer);
  frameTimer = setTimeout(() => {
    if (!world) return;
    syncHint();
    if (mode === "exhibit") placeLead();
    if (current && (mode === "exhibit" || mode === "travel")) world.focusSector(current, clearFrame());
    else if (mode === "explore") frameOverview();
  }, 150);
});
// Runs on every rendered frame, so it only touches the DOM when something changed.
// Captions stay on their own signs. A sign whose center has left the screen takes its name with it.
function chromeRects() {
  const rects = [];
  for (const sel of [".deck-top", ".sectors", ".instruments", ".readout", ".hint"]) {
    const el = document.querySelector(sel);
    if (!el) continue;
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || parseFloat(cs.opacity) < 0.4) continue;
    if (el.hidden) continue;
    const r = el.getBoundingClientRect();
    if (r.width > 8 && r.height > 8) rects.push(r);
  }
  return rects;
}
function hitsChrome(x, y, w, h, rects) {
  const left = x - w / 2, right = x + w / 2, bottom = y + h;
  return rects.some((r) => right > r.left + 2 && left < r.right - 2 && bottom > r.top + 2 && y < r.bottom - 2);
}
function onOtherSign(id, x, y, w, h) {
  const left = x - w / 2, right = x + w / 2, top = y, bottom = y + h;
  return labels.some((other) => {
    if (other.s.id === id) return false;
    const r = world.signOnScreen(other.s.id);
    if (!r.halfW) return false;
    return right > r.x - r.halfW + 6 && left < r.x + r.halfW - 6 && bottom > r.y - r.halfH + 6 && top < r.y + r.halfH - 6;
  });
}
function placeLabels() {
  if (world.state().under) {
    for (const l of labels) if (!l.hide) { l.el.classList.add("off"); l.hide = true; l.el.tabIndex = -1; }
    return;
  }
  if (!headerH) {
    const deck = document.querySelector(".deck-top");
    const shown = deck && getComputedStyle(deck).display !== "none";
    headerH = shown ? Math.max(8, deck.offsetHeight - 8) : Math.max(8, sat + 4);
  }
  const W = labelsEl.clientWidth, H = labelsEl.clientHeight, rects = chromeRects();
  for (const l of labels) {
    if (!l.w) {
      const w = l.el.offsetWidth, h = l.el.offsetHeight;
      if (!w) continue;
      l.w = w; l.h = h;
    }
    const vis = world.signOnScreen(l.s.id);
    const halfH = vis.halfH || 0;
    const halfW = vis.halfW || 0;
    let x = vis.x;
    /* Just under the board. If that spot is taken, just over it, then beside it.
       Only as a last resort does the name sit on the picture, and then on its own plate. */
    let y = (vis.y ?? 0) + halfH + 2;
    let hide = !vis.fullyIn, plate = false;
    const blockedAt = (xx, yy) => onOtherSign(l.s.id, xx, yy, l.w, l.h) || hitsChrome(xx, yy, l.w, l.h, rects) || yy < headerH || yy + l.h > H - 6 || xx - l.w / 2 < 6 || xx + l.w / 2 > W - 6;
    if (!hide && blockedAt(x, y)) y = (vis.y ?? 0) - halfH - l.h - 4;
    if (!hide && blockedAt(x, y)) {
      const outward = x < W / 2 ? -1 : 1;
      const beside = (dir) => vis.x + dir * (halfW + l.w / 2 + 10);
      x = beside(outward);
      y = (vis.y ?? 0) - l.h / 2;
      if (blockedAt(x, y)) x = beside(-outward);
    }
    if (!hide && blockedAt(x, y)) {
      x = vis.x; y = (vis.y ?? 0) + halfH - l.h - 8; plate = true;
      if (hitsChrome(x, y, l.w, l.h, rects) || y < headerH || y + l.h > H - 6 || x - l.w / 2 < 6 || x + l.w / 2 > W - 6) hide = true;
    }
    if (plate !== l.plate) { l.el.classList.toggle("plate", plate); l.plate = plate; }
    if (hide !== l.hide) { l.el.classList.toggle("off", hide); l.hide = hide; }
    if (hide) continue;
    const at = `translate(${Math.round(x)}px, ${Math.round(y)}px) translate(-50%, 0)`;
    if (at !== l.at) { l.el.style.transform = at; l.at = at; }
    const z = String(Math.round((1 - (vis.z ?? 0)) * 1000));
    if (z !== l.z) { l.el.style.zIndex = z; l.z = z; }
    const on = l.s.id === shownSelection();
    if (on !== l.on) { l.el.classList.toggle("on", on); l.on = on; }
  }
}

/* ---------- minimap ---------- */
const mm = $("minimap"), mctx = mm.getContext("2d");
let mmKey = "";
function drawMinimap() {
  const st = world.state();
  const key = [st.az, st.zoom, st.tx, st.tz, st.scout.x, st.scout.z, shownSelection(), foundArtifacts.size].map((v) => (typeof v === "number" ? v.toFixed(3) : v)).join();
  if (key === mmKey) return;
  mmKey = key;
  const W = mm.width, c = W / 2, k = (W / 2 - 14) / st.R;
  const P = (x, z) => [c + x * k, c + z * k];
  mctx.clearRect(0, 0, W, W);
  mctx.fillStyle = "#101116"; mctx.beginPath(); mctx.arc(c, c, st.R * k, 0, 7); mctx.fill();
  mctx.strokeStyle = "rgba(232,196,74,.35)"; mctx.lineWidth = 2; mctx.stroke();
  mctx.strokeStyle = "rgba(232,196,74,.25)"; mctx.lineWidth = 3; mctx.beginPath(); mctx.arc(c, c, 10.5 * k, 0, 7); mctx.stroke();
  for (const s of st.sectors) {
    const [x, y] = P(s.x, s.z);
    mctx.strokeStyle = "rgba(232,196,74,.2)"; mctx.beginPath(); mctx.moveTo(c, c); mctx.lineTo(x, y); mctx.stroke();
    const sel = shownSelection();
    mctx.fillStyle = s.accent; mctx.globalAlpha = s.id === sel ? 1 : 0.75;
    mctx.beginPath(); mctx.arc(x, y, s.id === sel ? 15 : 11, 0, 7); mctx.fill();
    mctx.globalAlpha = 1;
  }
  for (const a of st.artifacts) {
    if (a.under) continue;
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
/* Screen area left clear of the exhibit sheet, header, and edges. */
/* Keep every sign in the band the header and the bottom dock leave open. */
function exploreClear() {
  const deck = document.querySelector(".deck-top");
  const deckShown = deck && getComputedStyle(deck).display !== "none";
  const top = (deckShown ? deck.getBoundingClientRect().height : sat) + 8;
  const hint = $("hint");
  const hintShown = hint && !hint.hidden && getComputedStyle(hint).display !== "none" && parseFloat(getComputedStyle(hint).opacity) > 0.4;
  if (phoneMQ.matches) {
    const btn = $("sectors-btn").getBoundingClientRect();
    const inst = document.querySelector(".instruments").getBoundingClientRect();
    let dockTop = inst.height > 8 ? Math.min(btn.top, inst.top) : btn.top;
    if (hintShown) dockTop = Math.min(dockTop, hint.getBoundingClientRect().top);
    const bottom = Math.max(56, innerHeight - dockTop + 6);
    const height = Math.max(180, innerHeight - top - bottom);
    return { cx: innerWidth / 2, cy: top + height / 2, w: Math.max(140, innerWidth - 16), h: height };
  }
  const bottom = hintShown ? Math.max(48, innerHeight - hint.getBoundingClientRect().top + 6) : 36;
  const height = Math.max(220, innerHeight - top - bottom);
  return { cx: innerWidth / 2, cy: top + height / 2, w: Math.max(280, innerWidth - 36), h: height };
}
/* The thesis stays under the title. The photograph follows it, in the body. */
function placeLead() {
  const body = $("ex-body");
  const parked = document.querySelector(".exhibit .ex-head .gallery");
  if (!parked || !body) return;
  body.prepend(parked);
}
function hintLine(kind) {
  const touch = phoneMQ.matches || matchMedia("(pointer: coarse)").matches;
  if (kind === "under") return t("hintUnder");
  if (kind === "done") return buriedLeft() ? t("hintDoneBuried") : t("hintDone");
  if (kind === "scout") return t("hintScout");
  if (kind === "found") return touch ? t("hintFoundTouch") : t("hintFound");
  return touch ? t("hintExploreTouch") : t("hintExplore");
}
function syncHint() {
  const under = !!(world && world.state().under);
  $("hint").textContent = hintLine(under ? "under" : surfaceFound() >= SURFACE.length ? "done" : undefined);
}
function frameOverview({ home = false } = {}) {
  world?.overview(exploreClear(), { home });
}

function clearFrame() {
  const W = innerWidth, H = innerHeight;
  const deck = document.querySelector(".deck-top");
  const deckShown = deck && getComputedStyle(deck).display !== "none";
  const header = deckShown ? deck.getBoundingClientRect().height : 0;
  if (phoneMQ.matches) {
    const sheetTop = halfTop();
    const top = Math.max(header, sat) + 18;
    const height = Math.max(120, sheetTop - top - 14);
    return { cx: W / 2, cy: top + height / 2, w: Math.max(140, W - 20), h: height };
  }
  const panel = Math.min(600, W * 0.47) + 36;
  const top = (header || 72) + 8;
  const bottom = 16;
  const height = Math.max(160, H - top - bottom);
  const width = Math.max(180, W - panel);
  return { cx: width / 2, cy: top + height / 2, w: width - 12, h: height };
}

function go(id, { fromTour = false, instant = false } = {}) {
  const s = byId(id);
  if (!s) return;
  if (mode === "explore") play("select");
  if (!fromTour) tour = null;
  current = id;
  clearTimeout(openTimer);
  if (app.classList.contains("no-webgl")) { listJump(id); return; }
  if (!world) { openExhibit(s); return; }
  world.setSelected(id);
  world.setIdleSpin(false);
  world.sendScoutToSector(id, () => world.setSelected(id));
  hideReadout();
  // Already reading: swap the panel in the same turn so the list, the card, and the sheet name one sector.
  if (mode === "exhibit" || instant || reduced) {
    openExhibit(s);
    return;
  }
  setMode("travel");
  world.focusSector(id, clearFrame());
  syncSectorList();
  openTimer = setTimeout(() => openExhibit(s), 950);
}

function openExhibit(s) {
  if (mode !== "exhibit") play("open"); else play("select");
  current = s.id;
  visited.add(s.id); persist();
  world?.setTrail(visited);
  setMode("exhibit");
  hideReadout();
  const ex = s.exhibit;
  const ix = SECTORS.indexOf(s);
  $("exhibit").style.setProperty("--accent", s.accent);
  $("ex-crumb").textContent = `${String(ix + 1).padStart(2, "0")} · ${s.short}`;
  $("ex-kicker").textContent = `${ex.kicker.replace(/^[^·]+·\s*/, "")} · ${s.era}`; // the bar above already names the sector
  $("ex-title").textContent = ex.title;
  // Headline logos (WSOP, 2 Hand Hold'em) sit beside the title as the exhibit's emblem.
  // The map already shows the sector's logo large above the sheet, so the sheet leads with the title.
  $("ex-emblem").hidden = true;
  $("ex-lede").textContent = ex.lede;
  $("ex-body").replaceChildren(...renderExhibitBody(s));
  placeLead();
  $("ex-foot").replaceChildren(footer(s));
  syncArrows(s);
  // Stepping to the next sector while reading full screen keeps the sheet where it is.
  if ($("exhibit").hidden || !$("exhibit").classList.contains("open")) setFull(false);
  $("exhibit").hidden = false;
  $("ex-scroll").scrollTop = 0;
  requestAnimationFrame(() => $("exhibit").classList.add("open"));
  $("ex-title").focus({ preventScroll: true });
  if (location.hash !== `#${s.id}`) history.replaceState(null, "", `#${s.id}`);
  document.title = t("exhibitTitle", { name: s.name });
  syncSectorList();
  if (world) { world.focusSector(s.id, clearFrame()); world.setBackground($("exhibit").classList.contains("full") ? "list" : "exhibit"); }
  syncProgress();
  requestAnimationFrame(markRead);
}

/* ---------- phone sheet: pull up to read full screen, pull down to let go ---------- */
// Where the half-height sheet rests. Read from the CSS (38vh), which on iPhones is not 38% of innerHeight.
const halfProbe = Object.assign(document.createElement("div"), { style: "position:fixed;top:0;height:38vh;width:0;visibility:hidden;pointer-events:none" });
document.body.append(halfProbe);
function halfTop() { return halfProbe.offsetHeight || innerHeight * 0.38; }
const sheet = $("exhibit"), sheetScroll = $("ex-scroll");
function setFull(on) {
  const sheet = $("exhibit");
  if (!phoneMQ.matches) on = false;
  if (sheet.classList.contains("full") === on) return;
  sheet.classList.toggle("full", on);
  // Full screen, the sheet is the only thing in view, so it says so to screen readers.
  if (on) { sheet.setAttribute("role", "dialog"); sheet.setAttribute("aria-modal", "true"); }
  else { sheet.removeAttribute("role"); sheet.removeAttribute("aria-modal"); }
  // Nothing of the world shows behind a full sheet, so let it rest.
  if (world && mode === "exhibit") world.setBackground(on ? "list" : "exhibit");
}
sheetScroll.addEventListener("scroll", markRead, { passive: true });
sheetScroll.addEventListener("scroll", () => {
  if (phoneMQ.matches && mode === "exhibit" && !sheet.classList.contains("full") && sheetScroll.scrollTop > 24) setFull(true);
}, { passive: true });
phoneMQ.addEventListener?.("change", () => setFull(false));
{
  let pull = null;
  const restTop = () => sheet.getBoundingClientRect().top;
  sheet.addEventListener("touchstart", (e) => {
    if (!phoneMQ.matches || e.touches.length !== 1 || e.target.closest(".ex-nav, .demo, .lightbox")) return;
    const onBar = !!e.target.closest(".exhibit-bar");
    if (!onBar && sheetScroll.scrollTop > 0) return;
    pull = { y0: e.touches[0].clientY, top0: restTop(), onBar, moved: false, last: e.touches[0].clientY, t: performance.now(), v: 0 };
  }, { passive: true });
  sheet.addEventListener("touchmove", (e) => {
    if (!pull) return;
    const y = e.touches[0].clientY, dy = y - pull.y0;
    // From the text, only a downward pull moves the sheet. An upward swipe scrolls, and the scroll opens it fully.
    if (!pull.moved) {
      if (Math.abs(dy) < 8) return;
      // Short exhibits have nothing to scroll, so an upward swipe on their text lifts the sheet directly.
      const canScroll = sheetScroll.scrollHeight > sheetScroll.clientHeight + 4;
      if (!pull.onBar && ((dy < 0 && canScroll) || sheetScroll.scrollTop > 0)) { pull = null; return; }
      pull.moved = true;
      sheet.classList.add("dragging");
    }
    e.preventDefault();
    const now = performance.now();
    pull.v = (y - pull.last) / Math.max(1, now - pull.t);
    pull.last = y; pull.t = now;
    const top = clamp(pull.top0 + dy, sat, innerHeight - 80);
    sheet.style.top = `${top}px`;
  }, { passive: false });
  const release = () => {
    if (!pull) return;
    const p = pull; pull = null;
    if (!p.moved) return;
    const top = restTop();
    sheet.classList.remove("dragging");
    sheet.style.top = "";
    const H = innerHeight, half = halfTop(), full = sheet.classList.contains("full");
    const flingDown = p.v > 0.6, flingUp = p.v < -0.6;
    if (top > (full ? H * 0.62 : half + 90) || (flingDown && top > half - 20)) closeExhibit();
    else if (flingUp || top < half * 0.6) setFull(true);
    else if (full && (flingDown || top > half * 0.6)) { setFull(false); sheetScroll.scrollTop = 0; }
  };
  sheet.addEventListener("touchend", release);
  sheet.addEventListener("touchcancel", release);
}

function footer(s) {
  const ix = SECTORS.indexOf(s);
  if (tour != null) {
    const pos = TOUR.indexOf(s.id);
    const next = TOUR[pos + 1] && byId(TOUR[pos + 1]);
    return h("div", { class: "tour-foot" },
      h("p", { class: "mono eyebrow", text: t("guidedTourStop", { pos: pos + 1, total: TOUR.length }) }),
      h("div", { class: "foot-actions" },
        next ? h("button", { type: "button", class: "btn-solid", onclick: () => go(next.id, { fromTour: true }), text: t("nextStop", { name: next.name }) })
             : h("button", { type: "button", class: "btn-solid", onclick: () => { tour = null; closeExhibit(); }, text: t("finishTour") }),
        h("button", { type: "button", class: "btn-ghost", onclick: () => { tour = null; $("ex-foot").replaceChildren(footer(s)); syncArrows(s); }, text: t("leaveTour") })));
  }
  const prev = SECTORS[(ix + SECTORS.length - 1) % SECTORS.length], next = SECTORS[(ix + 1) % SECTORS.length];
  return h("div", { class: "foot-actions spread" },
    h("button", { type: "button", class: "btn-ghost", onclick: () => go(prev.id), text: t("prevName", { name: prev.short }) }),
    h("button", { type: "button", class: "btn-ghost", onclick: closeExhibit, text: t("backToWorld") }),
    h("button", { type: "button", class: "btn-ghost", onclick: () => go(next.id), text: t("nextName", { name: next.short }) }));
}

function stepTargets(s) {
  if (tour != null) {
    const pos = TOUR.indexOf(s.id);
    const last = pos === TOUR.length - 1;
    return {
      prev: pos > 0 ? byId(TOUR[pos - 1]) : null,
      next: last ? null : byId(TOUR[pos + 1]),
      finish: last,
    };
  }
  const ix = SECTORS.indexOf(s);
  return {
    prev: SECTORS[(ix + SECTORS.length - 1) % SECTORS.length],
    next: SECTORS[(ix + 1) % SECTORS.length],
    finish: false,
  };
}

function syncArrows(s) {
  const tg = stepTargets(s);
  const prev = $("ex-prev"), next = $("ex-next");
  prev.hidden = !tg.prev;
  if (tg.prev) {
    $("ex-prev-name").textContent = tg.prev.short;
    prev.setAttribute("aria-label", t("previous", { name: tg.prev.name }));
  }
  if (tg.finish) {
    next.hidden = false;
    $("ex-next-name").textContent = t("finish");
    next.setAttribute("aria-label", t("finishTour"));
  } else if (tg.next) {
    next.hidden = false;
    $("ex-next-name").textContent = tg.next.short;
    next.setAttribute("aria-label", t("next", { name: tg.next.name }));
  } else next.hidden = true;
}

function step(dir) {
  const s = current && byId(current);
  if (!s) return;
  const t = stepTargets(s);
  if (dir > 0 && t.finish) { tour = null; closeExhibit(); return; }
  const dest = dir > 0 ? t.next : t.prev;
  if (dest) go(dest.id, { fromTour: tour != null });
}
$("ex-prev").addEventListener("click", () => step(-1));
$("ex-next").addEventListener("click", () => step(1));

function closeExhibit() {
  clearTimeout(openTimer);
  if (mode === "exhibit") play("close");
  if ($("exhibit").contains(document.activeElement)) {
    const drawerOpen = !$("sectors-panel").hidden;
    const backTo = drawerOpen ? $("sector-list").querySelector(`[data-id="${current}"]`) : $("sectors-btn");
    backTo?.focus({ preventScroll: true });
  }
  $("exhibit").classList.remove("open");
  setTimeout(() => { if (!$("exhibit").classList.contains("open")) { $("exhibit").hidden = true; setFull(false); } }, 280);
  setMode("explore");
  deselect();
  if (location.hash) history.replaceState(null, "", location.pathname + location.search);
  document.title = t("siteTitle");
  if (world) {
    world.setIdleSpin(true);
    world.setBackground("none");
    frameOverview({ home: true });
  }
}

function deselect() {
  current = null;
  world?.setSelected(null);
  hideReadout();
  syncSectorList();
}

/* ---------- sectors drawer ---------- */
function setDrawer(open) {
  $("sectors-panel").hidden = !open;
  $("sectors-btn").setAttribute("aria-expanded", String(open));
  app.classList.toggle("drawer-open", open);
}
$("sectors-btn").addEventListener("click", (e) => {
  e.stopPropagation();
  setDrawer($("sectors-panel").hidden);
});
/* The floating sign names are pointer-only; the sector list is the keyboard route to every exhibit. */
$("skip-link").addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  if (mode === "exhibit") closeExhibit();
  setDrawer(true);
  ($("sector-list").querySelector("a, button") || $("sectors-btn")).focus();
});
$("sector-list").addEventListener("click", (e) => {
  e.stopPropagation();
  setDrawer(false);
});
addEventListener("click", (e) => { if (!e.target.closest?.(".sectors")) setDrawer(false); });

/* ---------- tour ---------- */
$("tour-btn").addEventListener("click", () => { tour = 0; closeList(); go(TOUR[0], { fromTour: true }); });

/* ---------- list view (also the no-WebGL / small-screen alternative) ---------- */
function listJump(id) {
  document.getElementById(`list-${id}`)?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
}
function buildList() {
  $("list-nav").replaceChildren(...SECTORS.map((s, i) => h("a", { href: `#list-${s.id}`, style: `--accent:${s.accent}`, onclick: (e) => { e.preventDefault(); listJump(s.id); }, text: `${String(i + 1).padStart(2, "0")} ${s.short}` })));
  $("list-body").replaceChildren(...SECTORS.map((s) => h("article", { class: "list-ex", id: `list-${s.id}`, style: `--accent:${s.accent}` },
    s.key?.hero && s.key.fit === "contain" ? h("img", { class: "emblem", src: s.key.src, alt: s.key.alt, loading: "lazy", decoding: "async" }) : null,
    h("p", { class: "kicker mono", text: `${s.exhibit.kicker} · ${s.era}` }),
    h("h2", { text: s.name }),
    h("p", { class: "lede", text: s.exhibit.lede }),
    renderExhibitBody(s))));
  // Light up the chip for the exhibit being read.
  listObserver?.disconnect();
  const chips = [...$("list-nav").children];
  const seen = new IntersectionObserver((entries) => {
    const e = entries.find((x) => x.isIntersecting);
    if (!e) return;
    const on = chips.find((c) => c.hash === `#${e.target.id}`), nav = $("list-nav");
    chips.forEach((c) => c.classList.toggle("on", c === on));
    if (nav.scrollWidth > nav.clientWidth) nav.scrollTo({ left: on.offsetLeft - 16, behavior: reduced ? "auto" : "smooth" });
  }, { root: $("list-view"), rootMargin: "-30% 0px -60% 0px" });
  for (const a of $("list-body").children) seen.observe(a);
  listObserver = seen;
}
let listObserver = null;
let listBuilt = false;
function openList() {
  if (!listBuilt) { buildList(); listBuilt = true; }
  $("list-view").hidden = false;
  app.classList.add("listing");
  if (location.hash !== "#list") history.replaceState(null, "", "#list");
  world?.setBackground("list");
}
function closeList() {
  if (!world) return;
  $("list-view").hidden = true;
  app.classList.remove("listing");
  const back = mode === "exhibit" && current ? `#${current}` : location.pathname + location.search;
  if (location.hash === "#list") history.replaceState(null, "", back);
  world.setBackground(mode === "exhibit" ? "exhibit" : "none");
}
$("list-btn").addEventListener("click", () => { setDrawer(false); openList(); });
$("list-close").addEventListener("click", closeList);

/* ---------- artifacts ---------- */
let toastTimer = 0;
let toastHide = 0;
let queuedArtifact = null;
let shownArtifact = null;
function hideToast() {
  if (shownArtifact && mode !== "explore") queuedArtifact = queuedArtifact || shownArtifact;
  const t = $("toast");
  t.classList.remove("open");
  t.hidden = true;
  clearTimeout(toastTimer);
  clearTimeout(toastHide);
}
function showArtifact(a) {
  if (mode !== "explore") { queuedArtifact = a; hideToast(); return; }
  shownArtifact = a;
  $("toast").querySelector(".eyebrow").textContent = a.under ? t("buriedArtifact") : t("artifactRecovered");
  $("toast-title").textContent = a.title;
  $("toast-text").textContent = a.text;
  const toast = $("toast");
  toast.hidden = false;
  requestAnimationFrame(() => toast.classList.add("open"));
  clearTimeout(toastTimer);
  clearTimeout(toastHide);
  toastTimer = setTimeout(() => {
    toast.classList.remove("open");
    toastHide = setTimeout(() => { toast.hidden = true; }, 300);
  }, 4500);
}
function flushToast() {
  if (mode !== "explore" || !queuedArtifact) return;
  const a = queuedArtifact;
  queuedArtifact = null;
  showArtifact(a);
}
$("toast").addEventListener("click", () => {
  clearTimeout(toastTimer);
  const t = $("toast");
  t.classList.remove("open");
  clearTimeout(toastHide);
  toastHide = setTimeout(() => { t.hidden = true; }, 300);
});

/* ---------- keyboard ---------- */
addEventListener("keydown", (e) => {
  if (e.target.closest?.("input,textarea")) return;
  if (e.key === "Escape") {
    if (!$("lightbox").hidden) { closeLightbox(); return; }
    if (!$("list-view").hidden && world) { closeList(); return; }
    if (!$("sectors-panel").hidden) { setDrawer(false); return; }
    if (mode !== "explore") closeExhibit();
    return;
  }
  if (!world || !$("list-view").hidden || !$("lightbox").hidden || e.metaKey || e.ctrlKey || e.altKey) return;
  const n = Number(e.key);
  if (n >= 1 && n <= SECTORS.length) { go(SECTORS[n - 1].id, { instant: mode === "exhibit" }); return; }
  if (mode === "exhibit" && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
    e.preventDefault();
    step(e.key === "ArrowRight" ? 1 : -1);
    return;
  }
  if (e.target.closest?.(".exhibit")) return;
  if (e.key === "ArrowLeft") world.rotateBy(0.25);
  else if (e.key === "ArrowRight") world.rotateBy(-0.25);
  else if (e.key === "+" || e.key === "=") world.zoomBy(1.25);
  else if (e.key === "-") world.zoomBy(0.8);
});
/* ---------- sound: off by default, remembered per browser ---------- */
const soundBtn = $("sound-btn");
const syncSound = () => { soundBtn.setAttribute("aria-pressed", String(soundOn())); soundBtn.classList.toggle("on", soundOn()); };
soundBtn.addEventListener("click", () => { setSound(!soundOn()); syncSound(); });
syncSound();
$("zoom-in").addEventListener("click", () => world?.zoomBy(1.3));
$("zoom-out").addEventListener("click", () => world?.zoomBy(0.77));
$("ex-close").addEventListener("click", closeExhibit);
$("home-link").addEventListener("click", (e) => { e.preventDefault(); closeList(); if (mode !== "explore") closeExhibit(); deselect(); frameOverview({ home: true }); });
$("media-btn").addEventListener("click", (e) => { e.preventDefault(); closeList(); go("command", { instant: true }); });

/* ---------- language switching ---------- */
function applyI18n() {
  document.documentElement.lang = locale === "zh" ? "zh-Hans" : locale;
  document.querySelector('meta[name="description"]')?.setAttribute("content", t("metaDescription"));
  $("world")?.setAttribute("aria-label", t("canvasLabel"));
  document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll("[data-i18n-aria]").forEach((el) => el.setAttribute("aria-label", t(el.dataset.i18nAria)));
  document.querySelectorAll("[data-i18n-alt]").forEach((el) => el.setAttribute("alt", t(el.dataset.i18nAlt)));
  const switcher = $("lang-switch");
  if (switcher) {
    switcher.setAttribute("aria-label", t("language"));
    switcher.querySelectorAll("[data-lang]").forEach((b) => {
      const on = b.dataset.lang === locale;
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", String(on));
    });
  }
  document.title = mode === "exhibit" && current ? t("exhibitTitle", { name: byId(current).name }) : `Wayne “D22-soso” Chiang · ${t("livingArchive")}`;
  buildSectorList();
  buildLabels();
  syncProgress();
  $("sector-count").textContent = String(SECTORS.length).padStart(2, "0");
  $("art-total").textContent = SURFACE.length;
  $("finds-hint").textContent = t("findsHint", { n: SURFACE.length });
  $("mode").textContent = { explore: t("exploration"), travel: t("travel"), exhibit: t("exhibitMode") }[mode];
  if (mode === "exhibit" && current) $("view-name").textContent = byId(current).short;
  else if (mode === "explore") $("view-name").textContent = t("worldView");
  syncSectorList();
  syncHint();
  if (readoutFor) preview(readoutFor.id, readoutFor.kind);
  if (listBuilt) buildList();
  if (mode === "exhibit" && current && !$("exhibit").hidden) {
    const sc = $("ex-scroll").scrollTop;
    openExhibit(byId(current));
    $("ex-scroll").scrollTop = sc;
    document.querySelector(`[data-lang="${locale}"]`)?.focus({ preventScroll: true });
  }
}
function setLocale(code) {
  if (!LOCALES.some((l) => l.code === code) || code === locale) return;
  locale = code;
  persistLocale(code);
  t = makeT(locale);
  SECTORS = localizeSectors(BASE_SECTORS, locale);
  ARTIFACTS = localizeArtifacts(BASE_ARTIFACTS, locale);
  applyI18n();
}
document.querySelectorAll("[data-lang]").forEach((b) => b.addEventListener("click", () => setLocale(b.dataset.lang)));

/* ---------- boot ---------- */
function route() {
  const id = location.hash.slice(1);
  if (id === "list") openList();
  else if (byId(id)) go(id, { instant: true });
}

function fallback() {
  const id = location.hash.slice(1);
  app.classList.add("no-webgl");
  $("loading").remove();
  openList();
  if (byId(id)) { listJump(id); history.replaceState(null, "", `#${id}`); }
}
async function boot() {
    const { createWorld, webglAvailable } = await import("./world.js?v=81").catch((err) => { console.error(err); return {}; });
  if (!createWorld || !webglAvailable()) {
    fallback();
    return;
  }
  try {
    world = createWorld({
      canvas: $("world"), sectors: SECTORS, artifacts: ARTIFACTS, chrono: CHRONO, reduced,
      onHover: (hit) => { preview(hit ? hit.id : null, hit?.type); },
      onClick: (hit) => {
        if (!hit) { if (mode === "explore") deselect(); return; }
        if (hit.type === "sector") go(hit.id);
        else {
          const a = ARTIFACTS.find((x) => x.id === hit.id);
          if (foundArtifacts.has(a.id)) showArtifact(a);
          else if (a.under) world.revealArtifact(a.id);
          else { world.sendScoutToArtifact(a.id); $("hint").textContent = hintLine("scout"); }
        }
      },
      onCameraUser: () => {
        app.classList.add("touched");
        // Dragging or zooming leaves the last sector. The card and the list drop it too.
        if (mode === "explore" && current) deselect();
      },
      onFrame: () => {
        if (!world) return;
        const reading = mode === "exhibit" || app.classList.contains("listing");
        if (mode === "explore") {
          const under = !!world.state().under;
          const name = under ? t("beneathArchive") : t("worldView");
          if ($("view-name").textContent !== name) $("view-name").textContent = name;
          if (under !== wasUnder) {
            wasUnder = under;
            $("hint").textContent = hintLine(under ? "under" : surfaceFound() >= SURFACE.length ? "done" : surfaceFound() ? "found" : undefined);
          }
        }
        if (!reading) placeLabels();
        if (frameN++ % 3) return;
        app.classList.toggle("zoomed", world.state().zoom > 1.35);
        if (!reading && mm.offsetParent) drawMinimap(); // hidden on phones and while a sheet is open
      },
    });
  } catch (err) {
    console.error(err);
    fallback();
    return;
  }
  frameOverview({ home: true });
  world.restoreFound([...foundArtifacts]);
  app.classList.toggle("has-finds", surfaceFound() > 0);
  world.onDiscover((a) => {
    if (foundArtifacts.has(a.id)) return;
    foundArtifacts.add(a.id); persist(); syncSectorList(); syncProgress();
    play("find");
    app.classList.toggle("has-finds", surfaceFound() > 0);
    showArtifact(a);
    $("hint").textContent = hintLine(world.state().under ? "under" : surfaceFound() >= SURFACE.length ? "done" : "found");
  });
  syncHint();
  syncSectorList();
  world.setTrail(visited);
  try { route(); } catch (err) { console.error(err); }
  // Let the reveal be seen for a moment, and until the first frame is drawn, then lift it off the world.
  const firstFrame = Promise.race([world.ready, new Promise((r) => setTimeout(r, 6000))]);
  firstFrame.then(() => setTimeout(() => {
    $("loading").classList.add("done");
    if (mode === "explore") frameOverview();
    setTimeout(() => $("loading").remove(), 700);
  }, Math.max(0, (reduced ? 600 : 1500) - performance.now())));
}
addEventListener("hashchange", () => {
  const id = location.hash.slice(1);
  if (id === "list") { openList(); return; }
  closeList();
  if (byId(id)) { if (id !== current || mode === "explore") go(id); }
  else if (mode !== "explore") closeExhibit();
});
applyI18n();
boot();
