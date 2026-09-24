/* Offscreen silhouette + hero-layout sampling for the constellation boot. */

const STAR_PALETTE = [
  [0.831, 0.686, 0.216], // gold #d4af37
  [0.545, 0.361, 0.965], // violet #8b5cf6
  [0.376, 0.647, 0.98], // StarCraft blue #60a5fa
  [0.176, 0.831, 0.749], // teal #2dd4bf
  [0.91, 0.894, 1], // white
];

export function pickStarColor(i) {
  const roll = (i * 17 + 9) % 100;
  if (roll < 22) return STAR_PALETTE[0];
  if (roll < 40) return STAR_PALETTE[1];
  if (roll < 58) return STAR_PALETTE[2];
  if (roll < 70) return STAR_PALETTE[3];
  return STAR_PALETTE[4];
}

function downsample(pts, n) {
  if (pts.length <= n) return pts;
  const out = [];
  const stride = pts.length / n;
  for (let i = 0; i < n; i++) out.push(pts[Math.floor(i * stride)]);
  return out;
}

function sampleCanvas(draw, size, step) {
  const off = document.createElement("canvas");
  off.width = size;
  off.height = size;
  const g = off.getContext("2d", { willReadFrequently: true });
  if (!g) return [];
  g.clearRect(0, 0, size, size);
  g.fillStyle = "#fff";
  g.strokeStyle = "#fff";
  g.lineJoin = "round";
  g.lineCap = "round";
  draw(g, size, size);
  let img;
  try {
    img = g.getImageData(0, 0, size, size);
  } catch {
    return [];
  }
  const pts = [];
  for (let y = 0; y < size; y += step) {
    for (let x = 0; x < size; x += step) {
      if (img.data[(y * size + x) * 4 + 3] > 88) {
        pts.push({ nx: x / size, ny: y / size });
      }
    }
  }
  return pts;
}

function drawCruiser(g, w, h) {
  g.beginPath();
  g.moveTo(w * 0.05, h * 0.52);
  g.lineTo(w * 0.58, h * 0.38);
  g.lineTo(w * 0.96, h * 0.5);
  g.lineTo(w * 0.58, h * 0.62);
  g.closePath();
  g.fill();
  g.fillRect(w * 0.2, h * 0.3, w * 0.07, h * 0.4);
  g.beginPath();
  g.moveTo(w * 0.36, h * 0.18);
  g.lineTo(w * 0.5, h * 0.4);
  g.lineTo(w * 0.34, h * 0.42);
  g.closePath();
  g.fill();
}

function drawCrystal(g, w, h) {
  g.beginPath();
  g.moveTo(w * 0.5, h * 0.06);
  g.lineTo(w * 0.84, h * 0.5);
  g.lineTo(w * 0.5, h * 0.94);
  g.lineTo(w * 0.16, h * 0.5);
  g.closePath();
  g.fill();
}

function drawTetra(g, w, h) {
  g.beginPath();
  g.moveTo(w * 0.5, h * 0.1);
  g.lineTo(w * 0.9, h * 0.84);
  g.lineTo(w * 0.1, h * 0.84);
  g.closePath();
  g.fill();
}

function drawRing(g, w, h) {
  g.lineWidth = Math.max(7, w * 0.11);
  g.beginPath();
  g.arc(w * 0.5, h * 0.5, w * 0.3, 0, Math.PI * 2);
  g.stroke();
}

const ICON_LAYOUT = [
  { kind: "cruiser", draw: drawCruiser, cx: -2.85, cy: 1.2, scale: 2.55 },
  { kind: "crystal", draw: drawCrystal, cx: 2.55, cy: 1.4, scale: 1.7 },
  { kind: "tetra", draw: drawTetra, cx: -0.15, cy: -1.65, scale: 1.55 },
  { kind: "ring", draw: drawRing, cx: 2.4, cy: -1.05, scale: 1.75 },
];

export function sampleIcons(perIcon, step = 3) {
  return ICON_LAYOUT.map((spec) => ({
    kind: spec.kind,
    cx: spec.cx,
    cy: spec.cy,
    scale: spec.scale,
    pts: downsample(sampleCanvas(spec.draw, 140, step), perIcon),
  }));
}

function pushWorld(pts, clientToWorld, x, y, extra) {
  const p = clientToWorld(x, y);
  if (p) pts.push({ x: p.x, y: p.y, ...(extra || {}) });
}

function sampleRectEdges(rect, clientToWorld, count) {
  const pts = [];
  if (!rect || rect.width < 8 || rect.height < 8) return pts;
  const n = Math.max(8, count);
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const side = i % 4;
    if (side === 0) pushWorld(pts, clientToWorld, rect.left + t * rect.width, rect.top);
    else if (side === 1) pushWorld(pts, clientToWorld, rect.right, rect.top + t * rect.height);
    else if (side === 2) pushWorld(pts, clientToWorld, rect.right - t * rect.width, rect.bottom);
    else pushWorld(pts, clientToWorld, rect.left, rect.bottom - t * rect.height);
  }
  return pts;
}

export const SKY_PARTS = ["card", "lockup", "rest"];

export const SKY_PART_WEIGHTS = {
  card: 0.78,
  lockup: 0.13,
  rest: 0.09,
};

const SKY_PART_SELECTORS = {
  card: ".hero-photo-stack",
  lockup: ".hero-lockup",
  rest: ".hero-rest",
};

export function sampleHeroParts(clientToWorld, { coarse = false } = {}) {
  const budget = coarse ? 80 : 160;
  return SKY_PARTS.map((id) => {
    const el = document.querySelector(SKY_PART_SELECTORS[id]);
    const n = Math.max(8, Math.floor(budget * (SKY_PART_WEIGHTS[id] || 0.15)));
    const pts = [];
    if (!el || id === "card") return { id, pts };
    const rect = el.getBoundingClientRect();
    pts.push(...sampleRectEdges(rect, clientToWorld, n));
    return { id, pts };
  });
}
