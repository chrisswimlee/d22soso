/* Field Museum: click to move a squad across the map; structures open their exhibits as the squad arrives. */
import { SITES, WORLD, imgSrc } from "./exhibits.js";

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const coarse = matchMedia("(pointer: coarse)").matches;

const canvas = document.getElementById("field");
const ctx = canvas.getContext("2d");
const mini = document.getElementById("minimap");
const mctx = mini.getContext("2d");
const portrait = document.getElementById("portrait").getContext("2d");

const SPEED = 170;
const SIGHT = 230;
const OPEN_RANGE = 150;
const CELL = 32;
const SLOTS = [[0, 0], [-26, 18], [26, 18]];

let vw = 0, vh = 0, dpr = 1, zoom = 1;
const cam = { x: 0, y: 0, follow: true };
const keys = new Set();
let started = false;
let ping = null;
let drag = null;
let hoverSite = null;
let activeSite = null;
let dismissed = null;
let pointer = null;
const found = new Set();

/* ---------- seeded noise ---------- */
function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- terrain (painted once) ---------- */
const terrain = document.createElement("canvas");
terrain.width = WORLD.w;
terrain.height = WORLD.h;
paintTerrain(terrain.getContext("2d"));

function nearRoad(x, y) {
  const hub = SITES[0];
  return SITES.slice(1).some((s) => {
    const dx = s.x - hub.x, dy = s.y - hub.y;
    const t = Math.max(0, Math.min(1, ((x - hub.x) * dx + (y - hub.y) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(hub.x + dx * t - x, hub.y + dy * t - y) < 60;
  }) || SITES.some((s) => Math.hypot(s.x - x, s.y - y) < 120);
}

function paintTerrain(g) {
  const r = rng(22);
  g.fillStyle = "#0b0c0d";
  g.fillRect(0, 0, WORLD.w, WORLD.h);

  const soil = ["#1a1713", "#121619", "#14140f", "#18130f", "#0f1214"];
  for (let i = 0; i < 320; i++) {
    const x = r() * WORLD.w, y = r() * WORLD.h, rad = 60 + r() * 240;
    const grad = g.createRadialGradient(x, y, 0, x, y, rad);
    grad.addColorStop(0, soil[(r() * soil.length) | 0]);
    grad.addColorStop(1, "#0b0c0d00");
    g.globalAlpha = 0.55;
    g.fillStyle = grad;
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  g.globalAlpha = 1;

  // High-ground plateaus with a lit rim and a dark cliff face.
  for (let i = 0; i < 14; i++) {
    const cx = r() * WORLD.w, cy = r() * WORLD.h;
    if (nearRoad(cx, cy)) continue;
    const pts = [];
    const n = 9 + ((r() * 5) | 0), base = 90 + r() * 130;
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2, d = base * (0.7 + r() * 0.45);
      pts.push([cx + Math.cos(a) * d * 1.4, cy + Math.sin(a) * d * 0.8]);
    }
    const path = () => { g.beginPath(); pts.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); };
    g.save(); g.translate(0, 14); path(); g.fillStyle = "#040405"; g.fill(); g.restore();
    path(); g.fillStyle = "#17191b"; g.fill();
    g.strokeStyle = "#2b2a26"; g.lineWidth = 2; g.stroke();
  }

  // Roads from base camp to every structure.
  const hub = SITES[0];
  for (const s of SITES.slice(1)) {
    const mx = (hub.x + s.x) / 2 + (r() - 0.5) * 180, my = (hub.y + s.y) / 2 + (r() - 0.5) * 180;
    for (const [w, c] of [[44, "#14120e"], [26, "#1f1b15"], [10, "#272219"]]) {
      g.beginPath(); g.moveTo(hub.x, hub.y); g.quadraticCurveTo(mx, my, s.x, s.y);
      g.lineWidth = w; g.lineCap = "round"; g.strokeStyle = c; g.stroke();
    }
  }

  // A faint wash of each room's accent around its structure.
  for (const s of SITES) {
    const grad = g.createRadialGradient(s.x, s.y, 0, s.x, s.y, 300);
    grad.addColorStop(0, s.accent + "22");
    grad.addColorStop(1, s.accent + "00");
    g.fillStyle = grad;
    g.fillRect(s.x - 300, s.y - 300, 600, 600);
  }

  // Gravel, rocks, crystals.
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = r() < 0.5 ? "#ffffff0d" : "#0000002a";
    g.fillRect(r() * WORLD.w, r() * WORLD.h, 1 + r() * 2, 1 + r() * 2);
  }
  for (let i = 0; i < 170; i++) {
    const x = r() * WORLD.w, y = r() * WORLD.h;
    if (nearRoad(x, y)) continue;
    const s = 4 + r() * 12;
    g.fillStyle = "#00000066"; g.beginPath(); g.ellipse(x + 3, y + s * 0.5, s, s * 0.45, 0, 0, 7); g.fill();
    g.fillStyle = "#24231f"; g.beginPath(); g.ellipse(x, y, s, s * 0.7, r(), 0, 7); g.fill();
    g.fillStyle = "#3a3832"; g.beginPath(); g.ellipse(x - s * 0.25, y - s * 0.25, s * 0.4, s * 0.25, 0, 0, 7); g.fill();
  }
  for (let i = 0; i < 46; i++) {
    const x = r() * WORLD.w, y = r() * WORLD.h;
    if (nearRoad(x, y)) continue;
    const hue = r() < 0.6 ? "103,232,249" : "167,139,250";
    const glow = g.createRadialGradient(x, y, 0, x, y, 40);
    glow.addColorStop(0, `rgba(${hue},0.22)`); glow.addColorStop(1, `rgba(${hue},0)`);
    g.fillStyle = glow; g.fillRect(x - 40, y - 40, 80, 80);
    for (let k = 0; k < 4; k++) {
      const ox = (r() - 0.5) * 18, h = 8 + r() * 16, w = 3 + r() * 3;
      g.beginPath(); g.moveTo(x + ox, y - h); g.lineTo(x + ox + w, y); g.lineTo(x + ox - w, y); g.closePath();
      g.fillStyle = `rgba(${hue},0.85)`; g.fill();
      g.fillStyle = "#ffffff55"; g.fillRect(x + ox - 0.5, y - h + 3, 1, h - 5);
    }
  }
  const v = g.createRadialGradient(WORLD.w / 2, WORLD.h / 2, WORLD.h * 0.45, WORLD.w / 2, WORLD.h / 2, WORLD.w * 0.62);
  v.addColorStop(0, "#0000"); v.addColorStop(1, "#000a");
  g.fillStyle = v; g.fillRect(0, 0, WORLD.w, WORLD.h);
}

/* ---------- fog of war ---------- */
const cols = Math.ceil(WORLD.w / CELL), rows = Math.ceil(WORLD.h / CELL);
const explored = new Uint8Array(cols * rows);
const fog = document.createElement("canvas");
fog.width = cols; fog.height = rows;
const fctx = fog.getContext("2d");
const fogImg = fctx.createImageData(cols, rows);

function updateFog() {
  const vis = new Uint8Array(cols * rows);
  const rc = Math.ceil(SIGHT / CELL);
  for (const u of units) {
    const ux = Math.floor(u.x / CELL), uy = Math.floor(u.y / CELL);
    for (let y = uy - rc; y <= uy + rc; y++) {
      if (y < 0 || y >= rows) continue;
      for (let x = ux - rc; x <= ux + rc; x++) {
        if (x < 0 || x >= cols) continue;
        if (Math.hypot((x + 0.5) * CELL - u.x, (y + 0.5) * CELL - u.y) < SIGHT) {
          vis[y * cols + x] = 1; explored[y * cols + x] = 1;
        }
      }
    }
  }
  const d = fogImg.data;
  for (let i = 0; i < vis.length; i++) {
    d[i * 4 + 3] = vis[i] ? 0 : explored[i] ? 110 : 228;
  }
  fctx.putImageData(fogImg, 0, 0);
  return vis;
}
const isExplored = (x, y) => explored[Math.floor(y / CELL) * cols + Math.floor(x / CELL)] === 1;

/* ---------- squad ---------- */
const hub = SITES[0];
const units = SLOTS.map(([sx, sy], i) => ({
  x: hub.x + sx, y: hub.y + 90 + sy, tx: hub.x + sx, ty: hub.y + 90 + sy,
  face: -Math.PI / 2, selected: true, step: i * 2.1, moving: false,
}));

function order(x, y) {
  const sel = units.filter((u) => u.selected);
  if (!sel.length) return;
  const cx = sel.reduce((a, u) => a + u.x, 0) / sel.length, cy = sel.reduce((a, u) => a + u.y, 0) / sel.length;
  const a = Math.atan2(y - cy, x - cx) + Math.PI / 2;
  sel.forEach((u, i) => {
    const [sx, sy] = SLOTS[i % SLOTS.length];
    u.tx = clamp(x + sx * Math.cos(a) - sy * Math.sin(a), 20, WORLD.w - 20);
    u.ty = clamp(y + sx * Math.sin(a) + sy * Math.cos(a), 20, WORLD.h - 20);
  });
  ping = { x, y, t: 0 };
  cam.follow = true;
}

function sendTo(site) {
  order(site.x, site.y + 100);
  hint(`Moving to ${site.name}…`);
}

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ---------- input ---------- */
function toWorld(px, py) { return { x: px / zoom + cam.x, y: py / zoom + cam.y }; }
function siteAt(wx, wy) {
  return SITES.find((s) => Math.abs(wx - s.x) < 70 && wy > s.y - 120 && wy < s.y + 40 && isExplored(s.x, s.y));
}

canvas.addEventListener("pointerdown", (e) => {
  if (!started) return;
  canvas.setPointerCapture(e.pointerId);
  drag = { x0: e.clientX, y0: e.clientY, x1: e.clientX, y1: e.clientY, box: false, button: e.button };
});
canvas.addEventListener("pointermove", (e) => {
  const w = toWorld(e.clientX, e.clientY);
  hoverSite = siteAt(w.x, w.y) || null;
  canvas.style.cursor = hoverSite ? "pointer" : "crosshair";
  pointer = { x: e.clientX, y: e.clientY, inside: true };
  if (!drag) return;
  drag.x1 = e.clientX; drag.y1 = e.clientY;
  if (!coarse && drag.button === 0 && Math.hypot(drag.x1 - drag.x0, drag.y1 - drag.y0) > 8) drag.box = true;
});
canvas.addEventListener("pointerup", (e) => {
  if (!drag) return;
  const d = drag; drag = null;
  if (d.box) {
    const a = toWorld(Math.min(d.x0, d.x1), Math.min(d.y0, d.y1));
    const b = toWorld(Math.max(d.x0, d.x1), Math.max(d.y0, d.y1));
    const hit = units.filter((u) => u.x > a.x - 10 && u.x < b.x + 10 && u.y > a.y - 10 && u.y < b.y + 10);
    if (hit.length) units.forEach((u) => (u.selected = hit.includes(u)));
    syncUnitName();
    return;
  }
  const w = toWorld(e.clientX, e.clientY);
  const s = siteAt(w.x, w.y);
  if (d.button === 0 && !e.shiftKey && !units.some((u) => u.selected)) units.forEach((u) => (u.selected = true));
  s ? sendTo(s) : order(w.x, w.y);
});
canvas.addEventListener("pointerleave", () => { pointer = null; });
canvas.addEventListener("contextmenu", (e) => e.preventDefault());

addEventListener("keydown", (e) => {
  if (e.target.closest && e.target.closest("input,textarea")) return;
  const site = SITES.find((s) => s.key === e.key);
  if (site && started) { sendTo(site); return; }
  if (e.key === "Escape") closeExhibit(true);
  if (/^(Arrow|[wasd]$)/.test(e.key)) { keys.add(e.key); cam.follow = false; }
});
addEventListener("keyup", (e) => keys.delete(e.key));

mini.addEventListener("pointerdown", (e) => {
  const move = (ev) => {
    const r = mini.getBoundingClientRect();
    const wx = ((ev.clientX - r.left) / r.width) * WORLD.w, wy = ((ev.clientY - r.top) / r.height) * WORLD.h;
    if (ev.button === 2) { order(wx, wy); return; }
    cam.follow = false;
    cam.x = wx - vw / zoom / 2; cam.y = wy - vh / zoom / 2;
  };
  move(e);
  mini.setPointerCapture(e.pointerId);
  mini.onpointermove = move;
  mini.onpointerup = () => (mini.onpointermove = null);
});
mini.addEventListener("contextmenu", (e) => e.preventDefault());

/* ---------- HUD ---------- */
const cmd = document.getElementById("cmd");
for (const s of SITES) {
  const b = document.createElement("button");
  b.type = "button";
  b.style.setProperty("--c", s.accent);
  b.title = `${s.name} (${s.key})`;
  b.innerHTML = `<span class="hk">${s.key}</span>${s.name.split(/[ ’]/)[0]}`;
  b.addEventListener("click", () => { start(); sendTo(s); });
  s.button = b;
  cmd.appendChild(b);
}
document.getElementById("total").textContent = SITES.length;
const hintEl = document.getElementById("hint");
const hint = (t) => (hintEl.textContent = t);
function syncUnitName() {
  const n = units.filter((u) => u.selected).length;
  document.getElementById("unit-name").textContent = n ? `Scout squad ×${n}` : "No units selected";
}

const intro = document.getElementById("intro");
function start() {
  if (started) return;
  started = true;
  intro.hidden = true;
  canvas.focus?.();
}
document.getElementById("intro-go").addEventListener("click", start);
intro.addEventListener("click", (e) => { if (e.target === intro) start(); });

/* ---------- exhibit panel ---------- */
const panel = document.getElementById("exhibit");
document.getElementById("exhibit-close").addEventListener("click", () => closeExhibit(true));

function openExhibit(site) {
  const ex = site.exhibit;
  panel.style.setProperty("--accent", site.accent);
  document.getElementById("ex-kicker").textContent = ex.kicker;
  document.getElementById("ex-title").textContent = ex.title;
  const img = document.getElementById("ex-img");
  img.src = imgSrc(ex.img); img.alt = ex.alt;
  document.getElementById("ex-text").replaceChildren(...ex.body.map((t) => Object.assign(document.createElement("p"), { textContent: t })));
  document.getElementById("ex-facts").replaceChildren(...ex.facts.map((t) => Object.assign(document.createElement("li"), { textContent: t })));
  document.getElementById("ex-links").replaceChildren(...(ex.links || []).map((l) => Object.assign(document.createElement("a"), { href: l.href, textContent: l.label })));
  panel.hidden = false;
  requestAnimationFrame(() => panel.classList.add("open"));
  if (!found.has(site.id)) {
    found.add(site.id);
    site.button.classList.add("found");
    site.foundAt = performance.now();
    document.getElementById("found").textContent = found.size;
    hint(found.size === SITES.length ? "Every exhibit found. Thanks for visiting." : `${site.name} discovered.`);
  }
}
function closeExhibit(byUser) {
  if (byUser && activeSite) dismissed = activeSite;
  panel.classList.remove("open");
  setTimeout(() => { if (!panel.classList.contains("open")) panel.hidden = true; }, 260);
}

/* ---------- drawing ---------- */
function shade(hex, a) { return hex + Math.round(a * 255).toString(16).padStart(2, "0"); }

function drawShadow(x, y, w, h) {
  ctx.fillStyle = "#00000088";
  ctx.beginPath(); ctx.ellipse(x + 8, y + 4, w, h, 0, 0, 7); ctx.fill();
}

function poly(pts, fill, stroke) {
  ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke(); }
}

const KINDS = {
  outpost(s, t) {
    drawShadow(s.x, s.y, 70, 26);
    poly([[s.x - 64, s.y], [s.x - 40, s.y + 22], [s.x + 40, s.y + 22], [s.x + 64, s.y], [s.x + 40, s.y - 22], [s.x - 40, s.y - 22]], "#26241f", "#4a4436");
    ctx.fillStyle = "#1a1915"; ctx.fillRect(s.x - 40, s.y, 80, 14);
    const g = ctx.createLinearGradient(s.x - 34, 0, s.x + 34, 0);
    g.addColorStop(0, "#3d3829"); g.addColorStop(0.45, "#8a7a4a"); g.addColorStop(1, "#2a261c");
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(s.x, s.y - 6, 36, 40, 0, Math.PI, 0); ctx.fill();
    ctx.strokeStyle = s.accent; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(s.x, s.y - 6, 36, 40, 0, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    ctx.fillStyle = "#111"; ctx.fillRect(s.x - 1.5, s.y - 76, 3, 32);
    ctx.fillStyle = s.accent; ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 3); ctx.beginPath(); ctx.arc(s.x, s.y - 78, 3, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
  },
  keep(s, t) {
    drawShadow(s.x, s.y, 56, 20);
    ctx.fillStyle = "#3a352d"; ctx.fillRect(s.x - 40, s.y - 70, 80, 74);
    ctx.fillStyle = "#4a443a"; ctx.fillRect(s.x - 40, s.y - 70, 40, 74);
    for (let i = 0; i < 5; i++) { ctx.fillStyle = i % 2 ? "#3a352d" : "#4a443a"; ctx.fillRect(s.x - 40 + i * 16, s.y - 82, 12, 12); }
    ctx.strokeStyle = "#00000055"; ctx.lineWidth = 1;
    for (let y = s.y - 60; y < s.y; y += 12) { ctx.beginPath(); ctx.moveTo(s.x - 40, y); ctx.lineTo(s.x + 40, y); ctx.stroke(); }
    ctx.fillStyle = "#0c0c0c"; ctx.beginPath(); ctx.ellipse(s.x, s.y - 14, 12, 18, 0, Math.PI, 0); ctx.fillRect(s.x - 12, s.y - 14, 24, 18); ctx.fill();
    ctx.fillStyle = "#1a1a1a"; ctx.fillRect(s.x + 26, s.y - 120, 3, 40);
    const wave = Math.sin(t * 4) * 4;
    poly([[s.x + 29, s.y - 120], [s.x + 58, s.y - 114 + wave], [s.x + 29, s.y - 104]], s.accent);
  },
  spire(s, t) {
    drawShadow(s.x, s.y, 50, 18);
    poly([[s.x - 46, s.y], [s.x, s.y + 18], [s.x + 46, s.y], [s.x, s.y - 16]], "#1d1a26", "#3b3352");
    const g = ctx.createLinearGradient(s.x - 20, 0, s.x + 20, 0);
    g.addColorStop(0, "#c4b5fd"); g.addColorStop(0.5, s.accent); g.addColorStop(1, "#3b2a72");
    poly([[s.x, s.y - 150], [s.x + 20, s.y - 40], [s.x, s.y], [s.x - 20, s.y - 40]], g);
    poly([[s.x, s.y - 150], [s.x, s.y], [s.x - 20, s.y - 40]], "#ffffff22");
    const hover = Math.sin(t * 2) * 5;
    ctx.strokeStyle = shade("#e8c44a", 0.8); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(s.x, s.y - 100 + hover, 30, 8, 0, 0, 7); ctx.stroke();
    const glow = ctx.createRadialGradient(s.x, s.y - 80, 0, s.x, s.y - 80, 90);
    glow.addColorStop(0, shade(s.accent, 0.3)); glow.addColorStop(1, shade(s.accent, 0));
    ctx.fillStyle = glow; ctx.fillRect(s.x - 90, s.y - 170, 180, 180);
  },
  sanctum(s, t) {
    drawShadow(s.x, s.y, 60, 22);
    ctx.fillStyle = "#211a22"; ctx.beginPath(); ctx.ellipse(s.x, s.y + 6, 58, 22, 0, 0, 7); ctx.fill();
    ctx.fillStyle = "#2f2530"; ctx.beginPath(); ctx.ellipse(s.x, s.y, 58, 22, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = s.accent; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(s.x, s.y, 44, 15, 0, 0, 7); ctx.stroke();
    for (let i = 0; i < 3; i++) {
      const a = t * 0.8 + (i * Math.PI * 2) / 3;
      const cx = s.x + Math.cos(a) * 34, cy = s.y - 50 + Math.sin(a) * 10 + Math.sin(t * 2 + i) * 4;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.cos(a) * 0.2);
      ctx.fillStyle = "#120d14"; ctx.fillRect(-12, -17, 24, 34);
      ctx.strokeStyle = i === 1 ? "#fbbf24" : s.accent; ctx.lineWidth = 2; ctx.strokeRect(-12, -17, 24, 34);
      ctx.fillStyle = shade(s.accent, 0.5); ctx.fillRect(-8, -12, 16, 12);
      ctx.restore();
    }
  },
  foundry(s, t) {
    drawShadow(s.x, s.y, 70, 22);
    poly([[s.x - 60, s.y], [s.x - 60, s.y - 56], [s.x - 20, s.y - 76], [s.x + 60, s.y - 76], [s.x + 60, s.y - 20], [s.x + 20, s.y]], "#252a2c", "#3c4447");
    poly([[s.x - 60, s.y], [s.x - 60, s.y - 56], [s.x + 20, s.y - 56], [s.x + 20, s.y]], "#30373a");
    ctx.fillStyle = "#1c2022"; ctx.fillRect(s.x + 30, s.y - 120, 16, 56);
    for (let i = 0; i < 3; i++) {
      const p = (t * 0.6 + i / 3) % 1;
      ctx.fillStyle = `rgba(150,160,165,${0.35 * (1 - p)})`;
      ctx.beginPath(); ctx.arc(s.x + 38 + p * 14, s.y - 124 - p * 40, 6 + p * 12, 0, 7); ctx.fill();
    }
    ctx.save(); ctx.translate(s.x - 20, s.y - 30);
    for (const [dx, rot] of [[-8, -0.2], [8, 0.2]]) {
      ctx.save(); ctx.translate(dx, 0); ctx.rotate(rot);
      ctx.fillStyle = "#f5f0e1"; ctx.fillRect(-9, -13, 18, 26);
      ctx.strokeStyle = s.accent; ctx.lineWidth = 2; ctx.strokeRect(-9, -13, 18, 26); ctx.restore();
    }
    ctx.restore();
    ctx.fillStyle = shade(s.accent, 0.6 + 0.3 * Math.sin(t * 5));
    for (let i = 0; i < 3; i++) ctx.fillRect(s.x + 28, s.y - 48 + i * 12, 22, 4);
  },
  tower(s, t) {
    drawShadow(s.x, s.y, 40, 14);
    ctx.strokeStyle = "#5b6066"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(s.x - 26, s.y); ctx.lineTo(s.x, s.y - 140); ctx.lineTo(s.x + 26, s.y); ctx.stroke();
    for (let i = 1; i < 6; i++) {
      const y = s.y - i * 24, w = 26 * (1 - (i * 24) / 140);
      ctx.beginPath(); ctx.moveTo(s.x - w, y); ctx.lineTo(s.x + w, y); ctx.moveTo(s.x - w, y); ctx.lineTo(s.x + w * 0.8, y - 24); ctx.stroke();
    }
    ctx.fillStyle = "#26292c"; ctx.fillRect(s.x - 30, s.y - 10, 60, 14);
    ctx.fillStyle = "#ef4444"; ctx.globalAlpha = Math.sin(t * 4) > 0 ? 1 : 0.3;
    ctx.beginPath(); ctx.arc(s.x, s.y - 142, 3, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
    for (let i = 0; i < 3; i++) {
      const p = (t * 0.5 + i / 3) % 1;
      ctx.strokeStyle = shade(s.accent, 0.7 * (1 - p)); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(s.x, s.y - 142, 10 + p * 60, -Math.PI * 0.85, -Math.PI * 0.15); ctx.stroke();
    }
  },
  library(s) {
    drawShadow(s.x, s.y, 70, 20);
    ctx.fillStyle = "#3b3833"; ctx.fillRect(s.x - 64, s.y - 8, 128, 12);
    ctx.fillStyle = "#4b4740"; ctx.fillRect(s.x - 58, s.y - 14, 116, 8);
    ctx.fillStyle = "#14120f"; ctx.fillRect(s.x - 46, s.y - 70, 92, 56);
    for (let i = 0; i < 6; i++) {
      const x = s.x - 50 + i * 20;
      ctx.fillStyle = "#cfc8b6"; ctx.fillRect(x - 5, s.y - 70, 10, 56);
      ctx.fillStyle = "#8f887a"; ctx.fillRect(x + 2, s.y - 70, 3, 56);
    }
    ctx.fillStyle = "#e8b04a33"; ctx.fillRect(s.x - 6, s.y - 46, 12, 32);
    poly([[s.x - 66, s.y - 70], [s.x, s.y - 104], [s.x + 66, s.y - 70]], "#d9d2c0", "#8f887a");
    ctx.fillStyle = "#b8b09c"; ctx.fillRect(s.x - 66, s.y - 76, 132, 6);
  },
  tavern(s, t) {
    drawShadow(s.x, s.y, 56, 18);
    ctx.fillStyle = "#3a2716"; ctx.fillRect(s.x - 44, s.y - 50, 88, 54);
    ctx.strokeStyle = "#24170c"; ctx.lineWidth = 2;
    for (let x = s.x - 44; x < s.x + 44; x += 11) { ctx.beginPath(); ctx.moveTo(x, s.y - 50); ctx.lineTo(x, s.y + 4); ctx.stroke(); }
    poly([[s.x - 56, s.y - 46], [s.x, s.y - 96], [s.x + 56, s.y - 46]], "#5a2f1a", "#2a160b");
    const flick = 0.75 + 0.25 * Math.sin(t * 9) * Math.sin(t * 5.3);
    ctx.fillStyle = `rgba(245,158,11,${flick})`; ctx.fillRect(s.x - 30, s.y - 34, 14, 14); ctx.fillRect(s.x + 16, s.y - 34, 14, 14);
    const glow = ctx.createRadialGradient(s.x, s.y - 20, 0, s.x, s.y - 20, 80);
    glow.addColorStop(0, `rgba(245,158,11,${0.25 * flick})`); glow.addColorStop(1, "rgba(245,158,11,0)");
    ctx.fillStyle = glow; ctx.fillRect(s.x - 80, s.y - 100, 160, 160);
    ctx.fillStyle = "#1a0f08"; ctx.fillRect(s.x - 7, s.y - 22, 14, 26);
  },
  beacon(s, t) {
    drawShadow(s.x, s.y, 34, 12);
    poly([[s.x - 30, s.y], [s.x, s.y + 12], [s.x + 30, s.y], [s.x, s.y - 12]], "#2b2820", "#4d4636");
    poly([[s.x - 10, s.y - 2], [s.x - 6, s.y - 90], [s.x + 6, s.y - 90], [s.x + 10, s.y - 2]], "#3b372d");
    poly([[s.x - 10, s.y - 2], [s.x - 6, s.y - 90], [s.x, s.y - 90], [s.x, s.y - 2]], "#4b463a");
    const pulse = 0.6 + 0.4 * Math.sin(t * 2.4);
    const beam = ctx.createLinearGradient(0, s.y - 300, 0, s.y - 92);
    beam.addColorStop(0, shade(s.accent, 0)); beam.addColorStop(1, shade(s.accent, 0.35 * pulse));
    ctx.fillStyle = beam; ctx.fillRect(s.x - 8, s.y - 300, 16, 208);
    ctx.fillStyle = s.accent; ctx.beginPath(); ctx.arc(s.x, s.y - 96, 7, 0, 7); ctx.fill();
  },
};

function drawSite(s, t, near) {
  KINDS[s.kind](s, reduced ? 0 : t);
  if (found.has(s.id) || near || hoverSite === s) {
    const a = near ? 0.9 : hoverSite === s ? 0.7 : 0.35;
    ctx.strokeStyle = shade(s.accent, a); ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]); ctx.lineDashOffset = reduced ? 0 : -t * 20;
    ctx.beginPath(); ctx.ellipse(s.x, s.y + 6, 84, 30, 0, 0, 7); ctx.stroke(); ctx.setLineDash([]);
  }
  if (s.foundAt && !reduced) {
    const p = (performance.now() - s.foundAt) / 900;
    if (p < 1) {
      ctx.strokeStyle = shade(s.accent, 1 - p); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(s.x, s.y, 40 + p * 140, 15 + p * 50, 0, 0, 7); ctx.stroke();
    }
  }
  ctx.font = "600 12px 'IBM Plex Mono', monospace"; ctx.textAlign = "center";
  const label = `${s.key} · ${s.name}`;
  ctx.fillStyle = "#000000aa"; ctx.fillRect(s.x - ctx.measureText(label).width / 2 - 6, s.y + 34, ctx.measureText(label).width + 12, 18);
  ctx.fillStyle = found.has(s.id) ? s.accent : "#d6d1c4"; ctx.fillText(label, s.x, s.y + 47);
}

function drawUnit(u, t, g = ctx, scale = 1) {
  g.save(); g.translate(u.x, u.y); g.scale(scale, scale);
  if (u.selected && g === ctx) {
    g.strokeStyle = "#86efac"; g.lineWidth = 1.5;
    g.beginPath(); g.ellipse(0, 4, 15, 7, 0, 0, 7); g.stroke();
  }
  g.fillStyle = "#00000080"; g.beginPath(); g.ellipse(3, 5, 11, 5, 0, 0, 7); g.fill();
  const bob = u.moving && !reduced ? Math.sin(u.step * 2) * 1.5 : 0;
  const leg = u.moving && !reduced ? Math.sin(u.step) * 4 : 0;
  g.strokeStyle = "#2a2a2a"; g.lineWidth = 3; g.lineCap = "round";
  g.beginPath(); g.moveTo(-4, -4); g.lineTo(-5 + leg, 4); g.moveTo(4, -4); g.lineTo(5 - leg, 4); g.stroke();
  g.translate(0, -8 + bob);
  g.rotate(u.face + Math.PI / 2);
  g.fillStyle = "#4a4436"; g.beginPath(); g.ellipse(0, 0, 9, 10, 0, 0, 7); g.fill();
  g.fillStyle = "#8a7a4a"; g.beginPath(); g.ellipse(-2, -2, 6, 7, 0, 0, 7); g.fill();
  g.fillStyle = "#e8c44a"; g.fillRect(-5, -9, 10, 3);
  g.fillStyle = "#1b1b1b"; g.fillRect(6, -2, 5, 3);
  g.restore();
}

function drawPortrait(t) {
  const g = portrait;
  g.fillStyle = "#07080a"; g.fillRect(0, 0, 72, 72);
  const u = { x: 36, y: 50, face: -Math.PI / 2 + Math.sin(t * 0.7) * 0.4, moving: units[0].moving, step: units[0].step };
  drawUnit(u, t, g, 2.6);
  g.fillStyle = "#ffffff08"; for (let y = 0; y < 72; y += 3) g.fillRect(0, y, 72, 1);
}

/* ---------- loop ---------- */
let last = performance.now();
let miniBase = null;
let dust = Array.from({ length: 40 }, (_, i) => ({ x: Math.random() * WORLD.w, y: Math.random() * WORLD.h, s: 0.5 + Math.random() }));

function resize() {
  dpr = Math.min(devicePixelRatio || 1, 2);
  vw = innerWidth; vh = innerHeight;
  zoom = vw < 760 ? 0.72 : 1;
  canvas.width = vw * dpr; canvas.height = vh * dpr;
  miniBase = document.createElement("canvas");
  miniBase.width = mini.width; miniBase.height = mini.height;
  miniBase.getContext("2d").drawImage(terrain, 0, 0, mini.width, mini.height);
}
addEventListener("resize", resize);
resize();

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const t = now / 1000;

  for (const u of units) {
    const dx = u.tx - u.x, dy = u.ty - u.y, d = Math.hypot(dx, dy);
    u.moving = d > 2;
    if (u.moving) {
      const step = Math.min(d, SPEED * dt);
      u.x += (dx / d) * step; u.y += (dy / d) * step;
      u.face = Math.atan2(dy, dx);
      u.step += dt * 12;
    }
  }
  for (const a of units) for (const b of units) {
    if (a === b) continue;
    const dx = a.x - b.x, dy = a.y - b.y, d = Math.hypot(dx, dy);
    if (d > 0 && d < 18) { a.x += (dx / d) * 0.6; a.y += (dy / d) * 0.6; }
  }

  // Camera: follow the squad, or pan by keys / screen edge.
  const pan = 520 * dt;
  let px = 0, py = 0;
  if (keys.has("ArrowLeft") || keys.has("a")) px -= pan;
  if (keys.has("ArrowRight") || keys.has("d")) px += pan;
  if (keys.has("ArrowUp") || keys.has("w")) py -= pan;
  if (keys.has("ArrowDown") || keys.has("s")) py += pan;
  if (pointer && !coarse && started && !drag) {
    if (pointer.x < 8) px -= pan; else if (pointer.x > vw - 8) px += pan;
    if (pointer.y < 8) py -= pan; else if (pointer.y > vh - 8) py += pan;
  }
  if (px || py) { cam.follow = false; cam.x += px; cam.y += py; }
  if (cam.follow) {
    const lead = units.filter((u) => u.selected)[0] || units[0];
    const open = panel.classList.contains("open");
    const gx = lead.x - vw / zoom / 2 + (open && vw > 760 ? 200 : 0);
    const gy = lead.y - vh / zoom / 2 + (open && vw <= 760 ? vh * 0.3 : 40);
    const k = reduced ? 1 : 1 - Math.pow(0.02, dt);
    cam.x += (gx - cam.x) * k; cam.y += (gy - cam.y) * k;
  }
  cam.x = clamp(cam.x, -240, WORLD.w - vw / zoom + 440);
  cam.y = clamp(cam.y, -200, WORLD.h - vh / zoom + 400);

  // Which structure is the squad standing at?
  let near = null, best = OPEN_RANGE;
  for (const s of SITES) {
    for (const u of units) {
      const d = Math.hypot(u.x - s.x, u.y - (s.y + 40));
      if (d < best) { best = d; near = s; }
    }
  }
  if (started && near !== activeSite) {
    activeSite = near;
    if (dismissed && dismissed !== near) dismissed = null;
    if (near && near !== dismissed) openExhibit(near);
    else if (!near) { closeExhibit(false); dismissed = null; }
  }

  updateFog();

  ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, -cam.x * dpr * zoom, -cam.y * dpr * zoom);
  ctx.fillStyle = "#050506"; ctx.fillRect(cam.x - 10, cam.y - 10, vw / zoom + 20, vh / zoom + 20);
  ctx.drawImage(terrain, 0, 0);

  const drawables = [
    ...SITES.filter((s) => isExplored(s.x, s.y)).map((s) => ({ y: s.y, draw: () => drawSite(s, t, s === activeSite) })),
    ...units.map((u) => ({ y: u.y, draw: () => drawUnit(u, t) })),
  ].sort((a, b) => a.y - b.y);
  drawables.forEach((d) => d.draw());

  if (ping) {
    ping.t += dt;
    const p = ping.t / 0.6;
    if (p >= 1) ping = null;
    else {
      ctx.strokeStyle = `rgba(232,196,74,${1 - p})`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(ping.x, ping.y, 6 + p * 22, 3 + p * 10, 0, 0, 7); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(ping.x, ping.y, 2 + p * 10, 1 + p * 4, 0, 0, 7); ctx.stroke();
    }
  }

  if (!reduced) {
    ctx.fillStyle = "#e8e2c833";
    for (const d of dust) {
      d.x += d.s * 8 * dt; d.y -= d.s * 3 * dt;
      if (d.x > WORLD.w) d.x = 0; if (d.y < 0) d.y = WORLD.h;
      ctx.fillRect(d.x, d.y, d.s * 1.5, d.s * 1.5);
    }
  }

  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(fog, 0, 0, cols, rows, 0, 0, cols * CELL, rows * CELL);

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (drag && drag.box) {
    ctx.strokeStyle = "#86efac"; ctx.lineWidth = 1; ctx.fillStyle = "#86efac14";
    const x = Math.min(drag.x0, drag.x1), y = Math.min(drag.y0, drag.y1), w = Math.abs(drag.x1 - drag.x0), h = Math.abs(drag.y1 - drag.y0);
    ctx.fillRect(x, y, w, h); ctx.strokeRect(x + 0.5, y + 0.5, w, h);
  }

  // Minimap
  mctx.drawImage(miniBase, 0, 0);
  mctx.drawImage(fog, 0, 0, mini.width, mini.height);
  const sx = mini.width / WORLD.w, sy = mini.height / WORLD.h;
  for (const s of SITES) {
    if (!isExplored(s.x, s.y)) continue;
    mctx.fillStyle = s.accent; mctx.fillRect(s.x * sx - 3, s.y * sy - 3, 6, 6);
  }
  mctx.fillStyle = "#86efac";
  for (const u of units) mctx.fillRect(u.x * sx - 1.5, u.y * sy - 1.5, 3, 3);
  mctx.strokeStyle = "#ffffffcc"; mctx.lineWidth = 1;
  mctx.strokeRect(cam.x * sx + 0.5, cam.y * sy + 0.5, (vw / zoom) * sx, (vh / zoom) * sy);

  drawPortrait(t);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
