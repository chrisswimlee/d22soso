/* D22: The Living Archive — the floating diorama.
   Original low-poly art built from primitives; no game assets. */
import * as THREE from "three";

const R = 30;            // island radius
const SECTOR_R = 18.5;   // building ring
const APPROACH_R = 13.5; // where the scout stops in front of a building
const ROAD_R = 10.5;     // ring road
const BASE_TOP = 1.0, PLAZA_TOP = 1.15, PLATEAU_TOP = 1.4;
const deg = (d) => (d * Math.PI) / 180;
const polar = (a, r) => new THREE.Vector3(Math.cos(deg(a)) * r, 0, -Math.sin(deg(a)) * r);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Phones and low-core machines get Lambert shading; desktops keep the physically based look.
const LIGHT = matchMedia("(max-width: 760px), (pointer: coarse)").matches || (navigator.hardwareConcurrency || 8) <= 4;
const mats = new Map();
function mat(color, o = {}) {
  const key = color + JSON.stringify(o);
  if (!mats.has(key)) {
    const common = {
      color, flatShading: true, emissive: o.emissive ?? "#000000", emissiveIntensity: o.ei ?? 1,
      transparent: o.opacity != null, opacity: o.opacity ?? 1, side: o.side ?? THREE.FrontSide,
      depthWrite: o.opacity == null || o.opacity > 0.9,
    };
    mats.set(key, LIGHT ? new THREE.MeshLambertMaterial(common)
      : new THREE.MeshStandardMaterial({ ...common, roughness: o.rough ?? 0.85, metalness: o.metal ?? 0.05 }));
  }
  return mats.get(key);
}
const glow = (c, ei = 1.6) => mat(c, { emissive: c, ei, rough: 0.4 });

function mesh(geo, material, x = 0, y = 0, z = 0, shadow = true) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.castShadow = shadow; m.receiveShadow = true;
  return m;
}
const box = (w, h, d, m, x, y, z) => mesh(new THREE.BoxGeometry(w, h, d), m, x, y + h / 2, z);
const cyl = (rt, rb, h, m, x, y, z, seg = 8) => mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m, x, y + h / 2, z);
// A soft light cone from a fixture down to a target (additive, so it reads as haze rather than a solid).
function beam(from, to, color, r0 = 0.12, r1 = 0.75) {
  const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to), len = a.distanceTo(b);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, len, 16, 1, true),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), b.clone().sub(a).normalize());
  return m;
}

function canvasTex(w, h, draw) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const g = c.getContext("2d");
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return { tex: t, g, c };
}

/* ---------- buildings ---------- */
// Each builder returns a group that faces +z (toward the centre after placement) and an anim(t, dt) hook.
const BUILD = {
  arena(accent) {
    // A 1999 championship stage: two beige-CRT player booths face off under a scoreboard, crowd in the stands.
    const g = new THREE.Group();
    const stone = mat("#4a4658"), stone2 = mat("#3a3748"), dark = mat("#1c1b24"), beige = mat("#d6cfba"), steel = mat("#2b2b33");
    g.add(cyl(4.4, 4.7, 0.35, stone2, 0, 0, 0, 16));
    const field = canvasTex(256, 256, (c, w, h) => {
      c.fillStyle = "#15131f"; c.fillRect(0, 0, w, h);
      c.strokeStyle = "rgba(139,92,246,.35)"; c.lineWidth = 2;
      for (let i = 0; i <= w; i += 32) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i, h); c.stroke(); c.beginPath(); c.moveTo(0, i); c.lineTo(w, i); c.stroke(); }
      c.strokeStyle = "rgba(232,196,74,.7)"; c.lineWidth = 4; c.beginPath(); c.arc(w / 2, h / 2, 100, 0, 7); c.stroke();
    });
    g.add(mesh(new THREE.CylinderGeometry(3, 3, 0.06, 32), new THREE.MeshLambertMaterial({ map: field.tex }), 0, 0.38, 0));
    // Stepped stands with a crowd of lit seats; the gap faces the centre.
    const crowd = [glow(accent, 0.9), glow("#fde68a", 0.9), mat("#6b6880")];
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a)) - Math.PI / 2) < 0.35) continue;
      const tier = new THREE.Group();
      tier.add(box(1.25, 0.55, 0.5, stone2, 0, 0, 0.2));
      tier.add(box(1.25, 1.1, 0.5, stone, 0, 0, -0.3));
      for (let k = 0; k < 3; k++) {
        tier.add(box(0.16, 0.16, 0.16, crowd[(i + k) % 3], -0.4 + k * 0.4, 0.55, 0.2));
        tier.add(box(0.16, 0.16, 0.16, crowd[(i + k + 1) % 3], -0.4 + k * 0.4, 1.1, -0.3));
      }
      tier.position.set(Math.cos(a) * 3.75, 0.35, Math.sin(a) * 3.75);
      tier.rotation.y = -a - Math.PI / 2;
      g.add(tier);
    }
    // Stage and two player booths facing each other.
    g.add(box(3.6, 0.22, 1.5, dark, 0, 0.4, -0.5));
    const screen = canvasTex(128, 96, (c, w, h) => {
      c.fillStyle = "#0b1410"; c.fillRect(0, 0, w, h);
      c.strokeStyle = "rgba(74,222,128,.35)"; c.lineWidth = 1;
      for (let i = -h; i < w; i += 12) { c.beginPath(); c.moveTo(i, h); c.lineTo(i + h, 0); c.stroke(); c.beginPath(); c.moveTo(i, 0); c.lineTo(i + h, h); c.stroke(); }
      for (let i = 0; i < 9; i++) { c.fillStyle = i % 2 ? "#a78bfa" : "#fb923c"; c.fillRect(14 + ((i * 37) % 96), 14 + ((i * 23) % 64), 6, 6); }
      c.fillStyle = "#111"; c.fillRect(0, h - 18, w, 18); c.fillStyle = "#4ade80"; c.font = "bold 12px monospace"; c.fillText("GG  1 - 0", 8, h - 5);
    });
    const screenMat = new THREE.MeshBasicMaterial({ map: screen.tex, toneMapped: false });
    for (const sx of [-1, 1]) {
      const booth = new THREE.Group();
      booth.add(box(0.9, 0.06, 0.6, steel, 0, 0.72, 0));
      booth.add(box(0.06, 0.72, 0.5, steel, 0.4, 0, 0));
      booth.add(box(0.06, 0.72, 0.5, steel, -0.4, 0, 0));
      booth.add(box(0.5, 0.42, 0.42, beige, 0, 0.78, -0.1));          // CRT monitor
      booth.add(box(0.36, 0.3, 0.3, beige, 0, 0.78, -0.3));
      booth.add(mesh(new THREE.PlaneGeometry(0.42, 0.32), screenMat, 0, 0.99, 0.115, false));
      booth.add(box(0.44, 0.03, 0.14, beige, 0, 0.78, 0.2));          // keyboard
      booth.add(box(0.2, 0.62, 0.5, beige, 0.62, 0, -0.05));          // tower
      booth.add(box(0.46, 0.08, 0.42, mat(accent), 0, 0.42, 0.62));    // chair
      booth.add(box(0.46, 0.56, 0.08, mat(accent), 0, 0.46, 0.84));
      booth.add(cyl(0.04, 0.04, 0.42, dark, 0, 0, 0.62, 5));
      booth.position.set(sx * 1.05, 0.62, -0.5);
      booth.rotation.y = sx * Math.PI / 2;                             // screens face the opponent's back
      g.add(booth);
    }
    // Scoreboard cube over the stage.
    const board = canvasTex(256, 128, (c, w, h) => {
      c.fillStyle = "#07080b"; c.fillRect(0, 0, w, h);
      c.strokeStyle = accent; c.lineWidth = 6; c.strokeRect(3, 3, w - 6, h - 6);
      c.textAlign = "center"; c.fillStyle = "#e8c44a"; c.font = "bold 46px 'Space Grotesk', sans-serif"; c.fillText("1999", w / 2, 58);
      c.fillStyle = "#ece8dc"; c.font = "600 22px 'IBM Plex Mono', monospace"; c.fillText("WORLD CHAMPION", w / 2, 98);
    });
    const boardMat = new THREE.MeshBasicMaterial({ map: board.tex, toneMapped: false });
    const scoreboard = new THREE.Group();
    scoreboard.add(box(1.7, 0.95, 1.7, dark, 0, -0.47, 0));
    for (let k = 0; k < 4; k++) {
      const p = mesh(new THREE.PlaneGeometry(1.6, 0.8), boardMat, Math.sin((k * Math.PI) / 2) * 0.86, 0, Math.cos((k * Math.PI) / 2) * 0.86, false);
      p.rotation.y = (k * Math.PI) / 2;
      scoreboard.add(p);
    }
    for (const [x, z] of [[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]]) scoreboard.add(cyl(0.015, 0.015, 1.6, dark, x, 0.45, z, 4));
    scoreboard.position.set(0, 3.5, -0.5);
    g.add(scoreboard);
    // The trophy at the front of the stage.
    g.add(box(0.7, 0.55, 0.7, dark, 0, 0.4, 1.5));
    const pts = [[0, 0], [0.35, 0], [0.12, 0.15], [0.1, 0.5], [0.4, 0.8], [0.45, 1.1], [0, 1.0]].map(([x, y]) => new THREE.Vector2(x, y));
    const cup = mesh(new THREE.LatheGeometry(pts, 10), mat("#d4af37", { metal: 0.8, rough: 0.3, emissive: "#3a2a05" }), 0, 0.95, 1.5);
    g.add(cup);
    const ring = mesh(new THREE.TorusGeometry(0.75, 0.035, 6, 32), glow(accent, 2.2), 0, 2.4, 1.5, false);
    ring.rotation.x = Math.PI / 2;
    g.add(ring);
    // Banners and floodlights.
    const flags = [];
    for (const sx of [-1, 1]) {
      g.add(cyl(0.06, 0.06, 3.2, dark, sx * 2.4, 0.35, 2.6, 6));
      const flag = mesh(new THREE.PlaneGeometry(0.9, 0.6), mat(accent, { side: THREE.DoubleSide, emissive: accent, ei: 0.3 }), sx * 2.85, 3.1, 2.6);
      flags.push(flag); g.add(flag);
      g.add(cyl(0.08, 0.1, 3.6, stone2, sx * 3.6, 0.35, -2.2, 6));
      g.add(box(0.5, 0.25, 0.3, glow("#fff4cc", 2), sx * 3.6, 3.95, -2.2));
    }
    // Spotlights crossing on the trophy, a red carpet up to it, and gold rope posts.
    const beams = [-1, 1].map((sx) => { const b = beam([sx * 3.6, 3.95, -2.2], [0, 0.7, 1.5], "#fff1c2", 0.14, 0.8); g.add(b); return b; });
    g.add(box(0.9, 0.025, 1.9, mat("#8a1c2b", { rough: 0.95 }), 0, 0.41, 2.85));
    g.add(box(1.0, 0.012, 1.95, mat("#d4af37", { metal: 0.6, rough: 0.4 }), 0, 0.405, 2.85));
    for (const sx of [-1, 1]) for (const z of [2.2, 3.0, 3.75]) {
      g.add(cyl(0.035, 0.05, 0.55, mat("#d4af37", { metal: 0.8, rough: 0.3 }), sx * 0.68, 0.41, z, 6));
      g.add(mesh(new THREE.SphereGeometry(0.07, 8, 6), glow("#e8c44a", 1.2), sx * 0.68, 1.0, z, false));
    }
    for (const sx of [-1, 1]) for (const z of [2.6, 3.37]) g.add(box(0.03, 0.03, 0.75, glow("#b91c1c", 0.6), sx * 0.68, 0.84, z));
    return {
      g,
      anim(t) {
        beams.forEach((b, i) => (b.material.opacity = 0.13 + Math.sin(t * 1.3 + i * 2) * 0.04));
        ring.rotation.z = t * 0.6; ring.position.y = 2.4 + Math.sin(t * 1.5) * 0.1;
        cup.rotation.y = t * 0.4;
        scoreboard.rotation.y = t * 0.25;
        flags.forEach((f, i) => (f.rotation.y = Math.sin(t * 3 + i) * 0.35));
      },
    };
  },

  broadcast(accent) {
    const g = new THREE.Group();
    const wall = mat("#2c3236"), roof = mat("#1d2226"), dark = mat("#121518");
    g.add(box(4.4, 0.3, 3.4, mat("#283035"), 0, 0, -0.2));
    g.add(box(3.6, 1.9, 2.6, wall, 0, 0.3, -0.4));
    g.add(box(3.9, 0.18, 2.9, roof, 0, 2.2, -0.4));
    // Animated monitor wall facing the centre.
    // All six screens share one 3x2 canvas atlas: one texture upload per refresh instead of six.
    const labels = ["LIVE", "WSOP", "LATB", "REC", "CH 22", "ON AIR"];
    const hues = [140, 45, 0, 160, 200, 350];
    const atlas = canvasTex(384, 160, () => {});
    const screenMat = new THREE.MeshBasicMaterial({ map: atlas.tex, toneMapped: false });
    const scan = document.createElement("canvas");
    scan.width = 128; scan.height = 84;
    const sg = scan.getContext("2d");
    sg.fillStyle = "rgba(255,255,255,.08)";
    for (let y = 0; y < 84; y += 4) sg.fillRect(0, y, 128, 1);
    const screenParts = [];
    for (let i = 0; i < 6; i++) {
      const col = i % 3, row = Math.floor(i / 3);
      const geo = new THREE.PlaneGeometry(1, 0.62);
      const uv = geo.attributes.uv;
      for (let j = 0; j < uv.count; j++) uv.setXY(j, (col + uv.getX(j)) / 3, (uv.getY(j) + (row === 0 ? 1 : 0)) / 2);
      const m = new THREE.Mesh(geo);
      m.position.set(-1.15 + col * 1.15, 0.75 + row * 0.72, 0.92);
      m.updateMatrix();
      screenParts.push([m, m.matrix]);
    }
    g.add(bake(screenParts, screenMat));
    g.add(box(1.4, 0.32, 0.08, glow("#ef4444", 1.8), 0, 2.45, 0.9));
    // The set: an oval poker table under studio lights, a camera on a tripod.
    const felt = mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.08, 20), mat("#14532d"), 0, 0.88, 2.7);
    felt.scale.x = 1.55; g.add(felt);
    const rail = mesh(new THREE.TorusGeometry(0.95, 0.09, 5, 24), mat("#2a1a12"), 0, 0.94, 2.7);
    rail.rotation.x = Math.PI / 2; rail.scale.x = 1.55; g.add(rail);
    g.add(cyl(0.35, 0.5, 0.62, dark, 0, 0.3, 2.7, 8));
    const chipCols = ["#ef4444", "#111827", "#2563eb", "#f5f0e1", "#16a34a", "#e8c44a"];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const n = 2 + (i % 3);
      for (let k = 0; k < n; k++) g.add(cyl(0.09, 0.09, 0.04, mat(chipCols[(i + k) % 6]), Math.cos(a) * 1.05, 0.92 + k * 0.04, 2.7 + Math.sin(a) * 0.6, 10));
      g.add(cyl(0.16, 0.18, 0.5, mat("#3f3f46"), Math.cos(a) * 1.85, 0.3, 2.7 + Math.sin(a) * 1.15, 6));   // stools
    }
    for (let i = 0; i < 5; i++) g.add(box(0.2, 0.01, 0.28, mat("#f8f5ec"), -0.5 + i * 0.25, 0.93, 2.7));      // board cards
    const cam = new THREE.Group();
    for (const a of [0, 2.1, 4.2]) { const leg = cyl(0.025, 0.025, 1.3, dark, Math.cos(a) * 0.25, 0, Math.sin(a) * 0.25, 4); leg.rotation.z = Math.cos(a) * 0.2; leg.rotation.x = -Math.sin(a) * 0.2; cam.add(leg); }
    cam.add(box(0.32, 0.3, 0.6, mat("#27272a"), 0, 1.3, 0));
    cam.add(cyl(0.1, 0.12, 0.25, dark, 0, 1.35, -0.38, 8).rotateX(Math.PI / 2));
    cam.add(mesh(new THREE.SphereGeometry(0.04, 5, 4), glow("#ef4444", 2.5), 0.1, 1.5, 0.3, false));
    cam.position.set(2.5, 0.3, 3.6); cam.rotation.y = Math.atan2(2.5, 0.9) + Math.PI;
    g.add(cam);
    for (const sx of [-1, 1]) {
      g.add(cyl(0.03, 0.03, 2.4, dark, sx * 2.6, 0.3, 1.9, 4));
      const lamp = box(0.4, 0.3, 0.3, mat("#3f3f46"), sx * 2.6, 2.6, 1.9); lamp.rotation.y = -sx * 0.9; g.add(lamp);
      g.add(mesh(new THREE.CircleGeometry(0.12, 10), glow("#fff4cc", 3), sx * 2.48, 2.75, 2.06, false).rotateY(-sx * 0.9));
    }
    // Lattice antenna.
    const tower = new THREE.Group();
    tower.position.set(1.9, 0.3, -1.4);
    for (const [x, z] of [[-0.35, -0.35], [0.35, -0.35], [-0.35, 0.35], [0.35, 0.35]]) {
      const leg = cyl(0.03, 0.05, 5, mat("#6b7280", { metal: 0.6 }), x * 0.6, 0, z * 0.6, 4);
      leg.rotation.z = -x * 0.1; leg.rotation.x = z * 0.1;
      tower.add(leg);
    }
    for (let y = 0.6; y < 5; y += 0.8) tower.add(box(0.5 - y * 0.06, 0.04, 0.5 - y * 0.06, mat("#6b7280"), 0, y, 0));
    const tipOn = glow("#ef4444", 3), tipOff = mat("#4a1010");
    const tip = mesh(new THREE.SphereGeometry(0.12, 8, 6), tipOn, 0, 5.1, 0, false);
    tower.add(tip);
    const waves = [0, 1, 2].map(() => {
      const w = mesh(new THREE.TorusGeometry(0.4, 0.025, 4, 32), mat(accent, { emissive: accent, ei: 2, opacity: 0.6 }).clone(), 0, 5.1, 0, false);
      w.rotation.x = Math.PI / 2;
      tower.add(w);
      return w;
    });
    g.add(tower);
    // Satellite dish.
    const dish = new THREE.Group();
    dish.position.set(-1.6, 2.4, -1);
    const bowl = mesh(new THREE.SphereGeometry(0.6, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2.6), mat("#cbd5e1", { side: THREE.DoubleSide, metal: 0.4 }), 0, 0, 0);
    bowl.rotation.x = -Math.PI / 2.5;
    dish.add(bowl); dish.add(cyl(0.05, 0.08, 0.5, dark, 0, -0.5, 0, 6));
    g.add(dish);
    // Studio light stands raking across the table.
    const studio = [-1, 1].map((sx) => {
      g.add(cyl(0.035, 0.05, 2.6, mat("#4b5563", { metal: 0.5 }), sx * 2.15, 0.3, 3.25, 5));
      const lamp = box(0.42, 0.34, 0.3, glow("#fff7e0", 1.8), sx * 2.15, 2.85, 3.25);
      lamp.rotation.y = -sx * 0.6; g.add(lamp);
      const b = beam([sx * 2.15, 3.0, 3.25], [sx * 0.3, 0.9, 2.7], "#fff4d6", 0.16, 0.85); g.add(b); return b;
    });
    let tick = 0;
    return {
      g,
      anim(t, dt) {
        tip.material = Math.sin(t * 4) > 0 ? tipOn : tipOff;
        waves.forEach((w, i) => {
          const p = (t * 0.5 + i / 3) % 1;
          w.scale.setScalar(1 + p * 5); w.material.opacity = 0.7 * (1 - p);
        });
        dish.rotation.y = Math.sin(t * 0.3) * 0.8;
        studio.forEach((b, i) => (b.material.opacity = 0.12 + Math.sin(t * 1.1 + i * 2.5) * 0.035));
        tick += dt;
        if (tick > 0.15) {
          tick = 0;
          const c = atlas.g;
          for (let n = 0; n < 6; n++) {
            const label = labels[n], hue = hues[n];
            c.save();
            c.translate((n % 3) * 128, (n < 3 ? 0 : 1) * 80);
            c.beginPath(); c.rect(0, 0, 128, 80); c.clip();
            const gr = c.createLinearGradient(0, 0, 128, 80);
            gr.addColorStop(0, `hsl(${hue + Math.sin(t + hue) * 20},60%,${22 + Math.sin(t * 2 + hue) * 6}%)`);
            gr.addColorStop(1, "#05070a");
            c.fillStyle = gr; c.fillRect(0, 0, 128, 80);
            for (let i = 0; i < 6; i++) {
              const h = 8 + Math.abs(Math.sin(t * 3 + i + hue)) * 30;
              c.fillStyle = "rgba(255,255,255,.18)"; c.fillRect(10 + i * 12, 70 - h, 8, h);
            }
            c.drawImage(scan, 0, ((t * 40) % 4) - 4);
            c.fillStyle = label === "LIVE" || label === "ON AIR" ? (Math.sin(t * 5) > 0 ? "#ef4444" : "#7f1d1d") : "#e9e6dc";
            c.font = "bold 18px monospace"; c.fillText(label, 8, 22);
            c.restore();
          }
          atlas.tex.needsUpdate = true;
        }
      },
    };
  },

  foundry(accent) {
    const g = new THREE.Group();
    const wall = mat("#566a6e"), roof = mat("#33494d"), dark = mat("#141a1c");
    g.add(box(5, 0.3, 3.6, mat("#263133"), 0, 0, -0.3));
    g.add(box(4.2, 1.6, 2.6, wall, 0, 0.3, -0.6));
    for (let i = 0; i < 3; i++) {
      const tooth = mesh(new THREE.CylinderGeometry(0.85, 0.85, 2.6, 3), roof, -1.4 + i * 1.4, 2.2, -0.6);
      tooth.rotation.x = Math.PI / 2; tooth.rotation.y = Math.PI / 2;
      g.add(tooth);
    }
    for (let i = 0; i < 4; i++) g.add(box(0.6, 0.12, 0.05, glow(accent, 2), -1.5 + i * 1, 1.1, 0.72));
    g.add(cyl(0.35, 0.45, 3.6, dark, 1.6, 0.3, -1.4, 8));
    const puffs = [0, 1, 2, 3].map((i) => {
      const p = mesh(new THREE.SphereGeometry(0.35, 6, 5), new THREE.MeshLambertMaterial({ color: "#9aa5a8", transparent: true, opacity: 0.5, flatShading: true, depthWrite: false }), 1.6, 4, -1.4, false);
      p.userData.o = i / 4;
      g.add(p);
      return p;
    });
    // The invention itself: a half-moon casino table printed with the game, two hands floating above it.
    const layout = canvasTex(256, 256, (c, w) => {
      c.fillStyle = "#0f5132"; c.fillRect(0, 0, w, w);
      c.textAlign = "center"; c.fillStyle = "#e8c44a"; c.font = "bold 20px 'Space Grotesk', sans-serif"; c.fillText("2 HAND HOLD'EM", w / 2, 152);
      c.fillStyle = "rgba(255,255,255,.7)"; c.font = "11px 'IBM Plex Mono', monospace"; c.fillText("PATENTED · TWO HANDS · ONE BOARD", w / 2, 170);
      c.strokeStyle = "rgba(255,255,255,.75)"; c.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        const a = Math.PI * (0.18 + i * 0.16), x = w / 2 + Math.cos(a) * 92, y = w / 2 + Math.sin(a) * 92;
        for (const d of [-11, 11]) { c.beginPath(); c.arc(x + d * Math.sin(a), y - d * Math.cos(a), 9, 0, 7); c.stroke(); }
      }
    });
    g.add(mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.55, 20, 1, false, -Math.PI / 2, Math.PI), mat("#3b2416"), 0, 0.3 + 0.275, 1.25));
    g.add(box(3, 0.55, 0.05, mat("#3b2416"), 0, 0.3, 1.25));
    const feltTop = mesh(new THREE.CircleGeometry(1.42, 24, Math.PI, Math.PI), new THREE.MeshLambertMaterial({ map: layout.tex }), 0, 0.86, 1.25);
    feltTop.rotation.x = -Math.PI / 2; g.add(feltTop);
    const tableRail = mesh(new THREE.TorusGeometry(1.46, 0.07, 5, 20, Math.PI), mat("#1c120c"), 0, 0.87, 1.25);
    tableRail.rotation.x = Math.PI / 2; g.add(tableRail);
    const chipCols = ["#ef4444", "#2563eb", "#111827", "#e8c44a"];
    for (let i = 0; i < 4; i++) for (let k = 0; k < 3 + (i % 2); k++) g.add(cyl(0.08, 0.08, 0.035, mat(chipCols[(i + k) % 4]), -0.9 + i * 0.6, 0.87 + k * 0.035, 2.25 - Math.abs(i - 1.5) * 0.25, 10));
    // Patent blueprint on an easel.
    const print = canvasTex(128, 96, (c, w, h) => {
      c.fillStyle = "#123a6b"; c.fillRect(0, 0, w, h);
      c.strokeStyle = "rgba(255,255,255,.18)"; c.lineWidth = 1;
      for (let i = 0; i < w; i += 8) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i, h); c.stroke(); }
      for (let i = 0; i < h; i += 8) { c.beginPath(); c.moveTo(0, i); c.lineTo(w, i); c.stroke(); }
      c.strokeStyle = "#e2e8f0"; c.lineWidth = 2;
      c.beginPath(); c.arc(64, 30, 40, 0.15 * Math.PI, 0.85 * Math.PI); c.lineTo(28, 36); c.stroke();
      c.strokeRect(40, 46, 12, 16); c.strokeRect(56, 46, 12, 16); c.strokeRect(76, 46, 12, 16);
      c.fillStyle = "#e2e8f0"; c.font = "bold 9px monospace"; c.fillText("FIG. 1", 8, 88); c.fillText("US PAT.", 84, 88);
    });
    const easel = new THREE.Group();
    easel.add(mesh(new THREE.PlaneGeometry(1.2, 0.9), new THREE.MeshBasicMaterial({ map: print.tex, toneMapped: false }), 0, 1.35, 0.03));
    for (const sx of [-1, 1]) { const leg = cyl(0.03, 0.03, 1.9, mat("#6b4f35"), sx * 0.45, 0, 0, 4); leg.rotation.z = sx * 0.12; easel.add(leg); }
    easel.position.set(-2.7, 0.3, 2.0); easel.rotation.y = 0.55;
    g.add(easel);
    const faces = [["A", "♠", "#111"], ["K", "♥", "#c81e1e"], ["Q", "♦", "#c81e1e"], ["J", "♣", "#111"]];
    const cards = faces.map(([r, s, col]) => {
      const face = canvasTex(64, 90, (c) => {
        c.fillStyle = "#f8f5ec"; c.fillRect(0, 0, 64, 90);
        c.strokeStyle = accent; c.lineWidth = 4; c.strokeRect(2, 2, 60, 86);
        c.fillStyle = col; c.font = "bold 26px serif"; c.fillText(r, 8, 30); c.font = "34px serif"; c.fillText(s, 18, 72);
      });
      const m = mesh(new THREE.PlaneGeometry(0.62, 0.88), new THREE.MeshLambertMaterial({ map: face.tex, side: THREE.DoubleSide }), 0, 0, 0, true);
      g.add(m);
      return m;
    });
    // Gear.
    const gear = new THREE.Group();
    gear.position.set(-2.3, 1.2, 0.75);
    gear.add(mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.18, 12), mat("#64748b", { metal: 0.6 }), 0, 0, 0));
    for (let i = 0; i < 10; i++) {
      const tth = mesh(new THREE.BoxGeometry(0.2, 0.18, 0.22), mat("#64748b", { metal: 0.6 }), Math.cos((i / 10) * Math.PI * 2) * 0.62, 0, Math.sin((i / 10) * Math.PI * 2) * 0.62);
      tth.rotation.y = -(i / 10) * Math.PI * 2;
      gear.add(tth);
    }
    gear.rotation.x = Math.PI / 2;
    g.add(gear);
    // A hand dealt on the felt: one five-card board, and four hole cards that become two hands.
    const faceUp = mat("#f8f5ec", { rough: 0.6 }), faceDown = mat("#8a1c2b", { rough: 0.7 });
    for (let i = 0; i < 5; i++) g.add(box(0.2, 0.012, 0.28, i < 3 ? faceUp : faceDown, -0.48 + i * 0.24, 0.865, 1.55));
    for (const [x, rot] of [[-0.5, 0.15], [-0.3, -0.05], [0.3, 0.05], [0.5, -0.15]]) {
      const c = box(0.2, 0.012, 0.28, faceUp, x, 0.865, 2.2); c.rotation.y = rot; g.add(c);
    }
    // A gold patent seal over the door.
    const seal = canvasTex(128, 128, (c, w, h) => {
      c.fillStyle = "#d4af37"; c.beginPath(); c.arc(64, 64, 62, 0, 7); c.fill();
      c.strokeStyle = "#7a5a10"; c.lineWidth = 4; c.beginPath(); c.arc(64, 64, 52, 0, 7); c.stroke();
      c.fillStyle = "#3d2a05"; c.textAlign = "center"; c.font = "bold 22px 'Space Grotesk', sans-serif"; c.fillText("U.S.", 64, 52);
      c.font = "bold 20px 'IBM Plex Mono', monospace"; c.fillText("PATENT", 64, 78);
    });
    const sealM = mesh(new THREE.CircleGeometry(0.3, 24), new THREE.MeshBasicMaterial({ map: seal.tex, toneMapped: false }), 0, 1.58, 0.72, false);
    g.add(sealM);
    return {
      g,
      anim(t) {
        cards.forEach((c, i) => {
          const hand = i < 2 ? -1 : 1, k = i % 2;
          c.position.set(hand * 0.75 + (k - 0.5) * 0.42, 1.75 + Math.sin(t * 1.6 + i) * 0.12, 1.75 + k * 0.05);
          c.rotation.set(-0.15, Math.sin(t * 0.7) * 0.25, (k - 0.5) * 0.35 * -hand);
        });
        gear.rotation.y = t * 0.8;
        for (const p of puffs) {
          const k = (t * 0.25 + p.userData.o) % 1;
          p.position.set(1.6 + k * 0.6, 4 + k * 2.4, -1.4 - k * 0.3);
          p.scale.setScalar(0.6 + k * 1.4);
          p.material.opacity = 0.45 * (1 - k);
        }
      },
    };
  },

  garden(accent) {
    // Cube Draft: a draft table inside a ring of standing giant cards, with the Cube itself hovering above.
    const g = new THREE.Group();
    const r = rng(7);
    const hues = ["#f5f0e1", "#60a5fa", "#a78bfa", "#ef4444", "#22c55e"];
    const faces = canvasTex(320, 88, (c) => {
      hues.forEach((hue, i) => {
        c.save(); c.translate(i * 64, 0);
        c.fillStyle = "#16141a"; c.fillRect(0, 0, 64, 88);
        c.fillStyle = hue; c.fillRect(4, 4, 56, 80);
        c.fillStyle = "rgba(0,0,0,.25)"; c.fillRect(7, 7, 50, 8);
        const gr = c.createLinearGradient(0, 18, 0, 50); gr.addColorStop(0, "rgba(255,255,255,.55)"); gr.addColorStop(1, "rgba(0,0,0,.35)");
        c.fillStyle = gr; c.fillRect(8, 18, 48, 30);
        c.fillStyle = "rgba(245,240,225,.92)"; c.fillRect(8, 52, 48, 28);
        c.fillStyle = "rgba(0,0,0,.35)"; for (let y = 57; y < 78; y += 5) c.fillRect(11, y, 30 + ((y * 7) % 12), 2);
        c.restore();
      });
    });
    const faceMat = new THREE.MeshLambertMaterial({ map: faces.tex });
    const card = (w, h, i) => {
      const geo = new THREE.PlaneGeometry(w, h);
      const uv = geo.attributes.uv;
      for (let j = 0; j < uv.count; j++) uv.setX(j, (i + uv.getX(j)) / 5);
      return mesh(geo, faceMat);
    };
    // Lawn and draft table with three players' picks laid out.
    g.add(cyl(4.6, 4.8, 0.12, mat("#22402a"), 0, 0, 0, 20));
    g.add(box(3.6, 0.55, 2.2, mat("#4a3322"), 0, 0.12, 0.2));
    g.add(box(3.4, 0.05, 2, mat("#1f3b2a"), 0, 0.67, 0.2));
    for (let i = 0; i < 15; i++) {
      const c = card(0.42, 0.58, i % 5);
      c.rotation.x = -Math.PI / 2; c.rotation.z = (r() - 0.5) * 0.3;
      c.position.set(-1.35 + (i % 5) * 0.67, 0.73, -0.45 + Math.floor(i / 5) * 0.62);
      g.add(c);
    }
    // Standing stones made of cards, open toward the centre.
    for (let i = 0; i < 9; i++) {
      const a = Math.PI + (i / 8) * Math.PI;                       // back half-ring
      const x = Math.cos(a) * 3.6, z = Math.sin(a) * 3.1 - 0.2;
      const stand = new THREE.Group();
      stand.add(box(1.0, 1.45, 0.08, mat("#2a2230"), 0, 0, -0.05));
      const f = card(0.92, 1.36, i % 5); f.position.set(0, 0.73, 0.0);
      const back = card(0.92, 1.36, (i + 2) % 5); back.position.set(0, 0.73, -0.1); back.rotation.y = Math.PI;
      stand.add(f, back);
      stand.add(box(1.1, 0.12, 0.3, mat("#3a3a40"), 0, 0, 0));
      stand.position.set(x, 0.12, z);
      stand.rotation.y = Math.atan2(-x, -z + 0.2);
      g.add(stand);
    }
    // The Cube, literally.
    const cube = new THREE.Group();
    cube.add(mesh(new THREE.BoxGeometry(1.1, 1.1, 1.1), mat("#2a1630", { opacity: 0.55, emissive: accent, ei: 0.25 }), 0, 0, 0, false));
    cube.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.1, 1.1, 1.1)), new THREE.LineBasicMaterial({ color: accent })));
    cube.position.set(0, 2.6, 0.2);
    g.add(cube);
    // A few trees behind the ring and lanterns along the path.
    for (let i = 0; i < 4; i++) {
      const x = -3.4 + i * 2.3, z = -3.6 - r() * 0.4;
      g.add(cyl(0.08, 0.1, 0.6, mat("#4a3420"), x, 0.12, z, 5));
      const h = 1.3 + r() * 0.7;
      g.add(mesh(new THREE.ConeGeometry(0.5, h, 6), mat(i % 2 ? "#2e6b35" : "#3f7d3a"), x, 0.72 + h / 2, z));
    }
    for (let i = 0; i < 10; i++) g.add(mesh(new THREE.SphereGeometry(0.08, 5, 4), glow(i % 2 ? accent : "#fde68a", 0.6), -2.6 + i * 0.58, 0.2, 2.4 + (i % 2) * 0.25, false));
    return {
      g,
      anim(t) {
        cube.rotation.set(t * 0.4, t * 0.6, 0);
        cube.position.y = 2.6 + Math.sin(t * 1.2) * 0.2;
      },
    };
  },

  library(accent) {
    const g = new THREE.Group();
    const marble = mat("#d9d2c0"), marble2 = mat("#b8b09c"), dark = mat("#1e1a14");
    g.add(box(5.4, 0.25, 3.8, marble2, 0, 0, -0.4));
    g.add(box(5, 0.25, 3.4, marble, 0, 0.25, -0.4));
    g.add(box(4.2, 2, 2.2, dark, 0, 0.5, -0.8));
    for (let i = 0; i < 6; i++) g.add(cyl(0.18, 0.2, 2, marble, -2 + i * 0.8, 0.5, 0.55, 10));
    g.add(box(4.8, 0.3, 3, marble2, 0, 2.5, -0.4));
    const tri = new THREE.Shape([new THREE.Vector2(-2.5, 0), new THREE.Vector2(2.5, 0), new THREE.Vector2(0, 1.1)]);
    const pedGeo = new THREE.ExtrudeGeometry(tri, { depth: 3, bevelEnabled: false });
    pedGeo.translate(0, 0, -1.5);
    g.add(mesh(pedGeo, marble, 0, 2.8, -0.4));
    g.add(box(1.8, 1.2, 0.1, glow("#e8b04a", 0.6), 0, 0.5, 0.31));
    // The book: a giant volume on a plinth whose cover breathes open.
    g.add(box(1.4, 0.8, 1, marble2, 0, 0, 2.1));
    const book = new THREE.Group();
    book.position.set(0, 0.85, 2.1);
    book.add(box(1.5, 0.22, 1.05, mat("#f5f0e1"), 0.0, 0.02, 0));
    const cover = new THREE.Group();
    cover.position.set(-0.78, 0.26, 0);
    cover.add(box(1.58, 0.05, 1.12, mat("#0f2a4a", { emissive: accent, ei: 0.08 }), 0.79, 0, 0));
    cover.add(box(0.9, 0.01, 0.2, glow("#e8c44a", 1.2), 0.79, 0.05, -0.2));
    book.add(cover);
    book.add(box(1.58, 0.05, 1.12, mat("#0f2a4a"), 0, -0.04, 0));
    book.rotation.x = -0.25;
    g.add(book);
    // Stacks of books flank the steps.
    const covers = ["#7f1d1d", "#1e3a5f", "#14532d", "#4a1d5c", "#8a6a1f"], pages = mat("#efe6cf");
    for (const sx of [-1, 1]) {
      let y = 0.25;
      for (let i = 0; i < 5; i++) {
        const w = 1.1 - i * 0.08, h = 0.18 + ((i * 3 + (sx > 0 ? 1 : 0)) % 3) * 0.05, d = 0.75 - i * 0.04;
        const bk = new THREE.Group();
        bk.add(box(w, h, d, mat(covers[(i + (sx > 0 ? 2 : 0)) % 5]), 0, 0, 0));
        bk.add(box(w - 0.06, h - 0.05, 0.02, pages, 0, 0.025, d / 2));
        bk.position.set(sx * 1.55, y, 2.15); bk.rotation.y = (i % 2 ? 0.12 : -0.1) * sx;
        g.add(bk);
        y += h;
      }
    }
    const lamps = [-2.4, 2.4].map((x) => {
      g.add(cyl(0.05, 0.05, 1.6, dark, x, 0.5, 2.2, 6));
      const l = mesh(new THREE.SphereGeometry(0.16, 8, 6), glow("#ffd27a", 2.2), x, 2.2, 2.2, false);
      g.add(l);
      return l;
    });
    return {
      g,
      anim(t) {
        cover.rotation.z = -(0.15 + (Math.sin(t * 0.6) * 0.5 + 0.5) * 1.6);
        lamps.forEach((l, i) => l.scale.setScalar(1 + Math.sin(t * 7 + i * 2) * 0.06));
      },
    };
  },

  command(accent) {
    // Media HQ: a lit office tower with the D22 crest, a press podium and a step-and-repeat wall out front.
    const g = new THREE.Group();
    const metal = mat("#3a3a36", { metal: 0.5, rough: 0.5 }), dark = mat("#1a1a18"), stoneLight = mat("#4a4840");
    g.add(cyl(3.0, 3.2, 0.3, mat("#2a2924"), 0, 0, -0.4, 8));
    const windows = canvasTex(64, 128, (c, w, h) => {
      c.fillStyle = "#14161c"; c.fillRect(0, 0, w, h);
      for (let y = 4; y < h - 4; y += 10) for (let x = 4; x < w - 4; x += 10) {
        const lit = ((x * 7 + y * 13) % 5) > 1;
        c.fillStyle = lit ? "rgba(255,214,140,.9)" : "rgba(80,96,120,.5)"; c.fillRect(x, y, 6, 6);
      }
    });
    const winMat = new THREE.MeshLambertMaterial({ map: windows.tex, emissive: "#ffffff", emissiveMap: windows.tex, emissiveIntensity: 0.55 });
    const tower = mesh(new THREE.BoxGeometry(2.1, 4.2, 1.7), winMat, 0, 0.3 + 2.1, -1.1);
    g.add(tower);
    for (const y of [0.3, 4.5]) g.add(box(2.3, 0.14, 1.9, metal, 0, y, -1.1));
    g.add(box(0.12, 4.3, 0.12, mat(accent, { emissive: accent, ei: 0.6 }), -1.06, 0.3, -0.24));
    g.add(box(0.12, 4.3, 0.12, mat(accent, { emissive: accent, ei: 0.6 }), 1.06, 0.3, -0.24));
    // D22 crest on the roof.
    const crest = canvasTex(128, 64, (c, w, h) => {
      c.clearRect(0, 0, w, h);
      c.fillStyle = "#e8c44a"; c.font = "bold 46px 'Space Grotesk', sans-serif"; c.textAlign = "center"; c.fillText("D22", w / 2, 48);
    });
    const crestMat = new THREE.MeshBasicMaterial({ map: crest.tex, transparent: true, toneMapped: false, depthWrite: false });
    g.add(mesh(new THREE.PlaneGeometry(1.6, 0.8), crestMat, 0, 5.05, -0.22, false));
    g.add(mesh(new THREE.PlaneGeometry(1.6, 0.8), crestMat, 0, 5.05, -0.26, false).rotateY(Math.PI));
    g.add(box(1.7, 0.08, 0.14, glow("#e8c44a", 1.2), 0, 4.62, -0.22));
    // Rooftop dish and beacon.
    const radar = new THREE.Group();
    radar.position.set(0.6, 4.6, -1.5);
    const rbowl = mesh(new THREE.SphereGeometry(0.45, 12, 6, 0, Math.PI * 2, 0, Math.PI / 3), mat("#c9c3b0", { side: THREE.DoubleSide, metal: 0.4 }), 0, 0.3, 0);
    rbowl.rotation.x = Math.PI / 2.4;
    radar.add(cyl(0.06, 0.1, 0.3, dark, 0, 0, 0, 6)); radar.add(rbowl);
    g.add(radar);
    const beacon = mesh(new THREE.SphereGeometry(0.14, 8, 6), glow(accent, 3), -0.7, 5.1, -1.6, false);
    g.add(cyl(0.03, 0.03, 0.5, dark, -0.7, 4.6, -1.6, 4)); g.add(beacon);
    // Step-and-repeat wall and press podium with microphones.
    const backdrop = canvasTex(256, 128, (c, w, h) => {
      c.fillStyle = "#0e0f13"; c.fillRect(0, 0, w, h);
      c.font = "bold 18px 'Space Grotesk', sans-serif"; c.textAlign = "center";
      for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) {
        c.fillStyle = (x + y) % 2 ? "#e8c44a" : "#9a948a";
        c.fillText((x + y) % 2 ? "D22" : "MEDIA", 26 + x * 52 + (y % 2) * 26, 22 + y * 26);
      }
    });
    const wall = mesh(new THREE.PlaneGeometry(3.4, 1.7), new THREE.MeshLambertMaterial({ map: backdrop.tex }), 0, 1.15, 0.5);
    g.add(wall);
    g.add(box(3.5, 0.1, 0.1, metal, 0, 2.0, 0.48));
    for (const sx of [-1, 1]) g.add(cyl(0.04, 0.04, 1.75, metal, sx * 1.72, 0.3, 0.48, 5));
    g.add(box(3.6, 0.12, 1.6, stoneLight, 0, 0.3, 1.3));                  // stage
    g.add(box(0.7, 0.95, 0.45, mat("#20242c"), 0, 0.42, 1.45));            // podium
    g.add(box(0.74, 0.06, 0.5, metal, 0, 1.37, 1.45));
    g.add(box(0.36, 0.2, 0.02, glow("#e8c44a", 1), 0, 0.95, 1.68));        // gold plaque
    const micCols = ["#ef4444", "#22c55e", "#60a5fa", "#e8c44a"];
    micCols.forEach((col, i) => {
      const x = -0.18 + i * 0.12;
      const m = cyl(0.012, 0.012, 0.32, dark, x, 1.4, 1.6, 4); m.rotation.x = 0.4; g.add(m);
      g.add(box(0.07, 0.06, 0.07, mat(col), x, 1.66, 1.72));
    });
    // Camera drone filming the podium.
    const drone = new THREE.Group();
    drone.add(box(0.5, 0.12, 0.5, dark, 0, 0, 0));
    for (const [x, z] of [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]]) drone.add(mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.02, 10), mat("#9ca3af", { opacity: 0.6 }), x, 0.1, z, false));
    drone.add(mesh(new THREE.SphereGeometry(0.06, 6, 4), glow("#22c55e", 2.5), 0, -0.06, 0.26, false));
    g.add(drone);
    // Flags out front.
    const flags = [];
    for (const sx of [-1, 1]) {
      g.add(cyl(0.04, 0.04, 2.6, metal, sx * 2.6, 0.3, 2.2, 5));
      const f = mesh(new THREE.PlaneGeometry(0.7, 0.45), mat(accent, { side: THREE.DoubleSide, emissive: accent, ei: 0.25 }), sx * 2.96, 2.6, 2.2);
      flags.push(f); g.add(f);
    }
    return {
      g,
      anim(t) {
        radar.rotation.y = t * 0.9;
        beacon.scale.setScalar(0.8 + (Math.sin(t * 3) * 0.5 + 0.5) * 0.6);
        const a = t * 0.6;
        drone.position.set(Math.cos(a) * 2.4, 2.6 + Math.sin(t * 2) * 0.15, 1.6 + Math.sin(a) * 1.2);
        drone.rotation.y = -a;
        flags.forEach((f, i) => (f.rotation.y = Math.sin(t * 2.6 + i) * 0.3));
      },
    };
  },
};

/* A pylon behind each building carrying a lit, turning billboard with the area's headline photo.
   The head swivels and tilts to meet the camera square-on, so the photo is never edge-on or squashed. */
const SIGN = { z: -3.4, bottom: 5.6, area: 9, heroArea: 22 };
function billboard(key, accent) {
  // Board takes the photo's own proportions, so nothing is squeezed or over-cropped.
  // The headline credentials (world title, WSOP, 2 Hand Hold'em) get boards over twice the size of the rest.
  const area = key?.hero ? SIGN.heroArea : SIGN.area;
  const r = key?.ratio || 1.5, w = Math.sqrt(area * r), h = Math.sqrt(area / r);
  const W = r >= 1 ? 384 : Math.round(384 * r), H = r >= 1 ? Math.round(384 / r) : 384;
  const art = canvasTex(W, H, (c) => { c.fillStyle = "#0c0d11"; c.fillRect(0, 0, W, H); });
  if (key?.src) {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      const c = art.g;
      if (key.fit === "contain") {
        const gr = c.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, Math.max(W, H) * 0.6);
        gr.addColorStop(0, "#1f2a24"); gr.addColorStop(1, "#0c0d11");
        c.fillStyle = gr; c.fillRect(0, 0, W, H);
        const k = Math.min((W - 24) / img.width, (H - 24) / img.height);
        c.drawImage(img, (W - img.width * k) / 2, (H - img.height * k) / 2, img.width * k, img.height * k);
      } else {
        const [px, py] = (key.pos || "50% 50%").split(" ").map((v) => parseFloat(v) / 100);
        const k = Math.max(W / img.width, H / img.height), dw = img.width * k, dh = img.height * k;
        if (key.hero) c.filter = "brightness(1.35) contrast(1.05)"; // the studio trophy shot is dark; lift it so it reads from afar
        c.drawImage(img, (W - dw) * px, (H - dh) * py, dw, dh);
        c.filter = "none";
      }
      art.tex.needsUpdate = true;
    };
    img.src = key.src;
  }
  const { bottom } = SIGN;
  const steel = mat("#2b2b33", { metal: 0.5, rough: 0.5 });
  // Pylon: a tapered mast on a footing, fixed to the ground.
  const pole = new THREE.Group();
  pole.add(box(0.9, 0.25, 0.9, steel, 0, 0, 0));
  pole.add(cyl(0.12, 0.2, bottom + 0.1, steel, 0, 0.2, 0, 6));
  // Head: frame, accent trim top and bottom, and the photo on both faces.
  const head = new THREE.Group();
  head.add(box(w + 0.24, h + 0.24, 0.2, mat("#16161b"), 0, -h / 2 - 0.12, 0));
  // Headline boards get a full lit gold frame; the rest keep a thin accent trim top and bottom.
  const t = key?.hero ? 0.14 : 0.08, trim = key?.hero ? glow("#e8c44a", 1.6) : glow(accent, 1.2);
  head.add(box(w + 0.32, t, 0.28, trim, 0, h / 2 + 0.1, 0));
  head.add(box(w + 0.32, t, 0.28, trim, 0, -h / 2 - 0.12 - t, 0));
  if (key?.hero) for (const x of [-1, 1]) head.add(box(t, h + 0.24, 0.28, trim, x * (w / 2 + 0.16 - t / 2), -h / 2 - 0.12, 0));
  const face = new THREE.MeshBasicMaterial({ map: art.tex, toneMapped: false });
  head.add(mesh(new THREE.PlaneGeometry(w, h), face, 0, 0, 0.11, false));
  head.add(mesh(new THREE.PlaneGeometry(w, h), face, 0, 0, -0.11, false).rotateY(Math.PI));
  mergeStatic(head, null, head); // still at the origin here, so world space equals head space
  head.rotation.order = "YXZ"; // swivel to the camera, then tilt back to meet it square-on
  return { pole, head, h };
}

/* Bake every part of a structure that never moves into one mesh per material.
   Moving parts are found by running the animation at two different times and seeing what changed. */
function mergeStatic(root, anim, into) {
  const state = (o) => [...o.position.toArray(), ...o.quaternion.toArray(), ...o.scale.toArray(), o.material?.uuid].join();
  const before = new Map();
  anim?.(1.3, 0.2);
  root.traverse((o) => before.set(o, state(o)));
  anim?.(7.9, 0.2);
  const moving = new Set();
  root.traverse((o) => { if (before.get(o) !== state(o)) moving.add(o); });
  const isStatic = (o) => { for (let p = o; p && p !== root; p = p.parent) if (moving.has(p)) return false; return true; };
  root.updateMatrixWorld(true);
  // Untextured materials that differ only in base colour share one draw call, with the colour moved into the vertices.
  const groups = new Map();
  const sig = (m) => m.map || m.emissiveMap ? m.uuid
    : [m.type, m.emissive?.getHex(), m.emissiveIntensity, m.roughness, m.metalness, m.side].join();
  root.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh || !isStatic(o) || Array.isArray(o.material) || o.material.transparent || !o.material.visible) return;
    const k = sig(o.material);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(o);
  });
  // Parts that move as one rigid piece (a gear and its teeth, a drone and its rotors) merge inside their group.
  for (const o of moving) {
    if (!o.isGroup) continue;
    const local = new Map();
    for (const c of o.children) {
      if (!c.isMesh || moving.has(c) || c.children.length || Array.isArray(c.material) || c.material.transparent) continue;
      if (!local.has(c.material)) local.set(c.material, []);
      local.get(c.material).push(c);
    }
    for (const [material, list] of local) {
      if (list.length < 2) continue;
      for (const c of list) c.updateMatrix();
      const merged = bake(list.map((c) => [c, c.matrix]), material);
      for (const c of list) { c.removeFromParent(); c.geometry.dispose(); }
      o.add(merged);
    }
  }
  for (const list of groups.values()) {
    if (list.length < 2) continue;
    let material = list[0].material, tint = false;
    if (list.some((m) => m.material !== material)) {
      material = material.clone();
      material.color.set(0xffffff); material.vertexColors = true;
      mats.set(material.uuid, material);
      tint = true;
    }
    const merged = bake(list.map((m) => [m, m.matrixWorld]), material, tint);
    for (const m of list) { m.removeFromParent(); m.geometry.dispose(); }
    into.add(merged);
  }
}

function bake(pairs, material, tint = false) {
  const parts = pairs.map(([m, matrix]) => {
    const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
    for (const k of Object.keys(g.attributes)) if (k !== "position" && k !== "normal" && !(k === "uv" && material.map)) g.deleteAttribute(k);
    return g.applyMatrix4(matrix);
  });
  const count = parts.reduce((n, g) => n + g.attributes.position.count, 0);
  const pos = new Float32Array(count * 3), nor = new Float32Array(count * 3);
  let off = 0;
  const uv = material.map ? new Float32Array(count * 2) : null;
  const col = tint ? new Float32Array(count * 3) : null;
  parts.forEach((g, i) => {
    const n = g.attributes.position.count;
    pos.set(g.attributes.position.array, off * 3); nor.set(g.attributes.normal.array, off * 3);
    uv?.set(g.attributes.uv.array, off * 2);
    if (col) { const c = pairs[i][0].material.color; for (let v = off; v < off + n; v++) { col[v * 3] = c.r; col[v * 3 + 1] = c.g; col[v * 3 + 2] = c.b; } }
    off += n; g.dispose();
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
  if (uv) geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  if (col) geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  geo.computeBoundingSphere();
  const merged = new THREE.Mesh(geo, material);
  merged.castShadow = pairs.some(([m]) => m.castShadow); merged.receiveShadow = true;
  return merged;
}

function monument() {
  const g = new THREE.Group();
  const stone = mat("#2a2833"), gold = mat("#d4af37", { metal: 0.8, rough: 0.3, emissive: "#2a1f05" });
  g.add(cyl(3.2, 3.4, 0.2, mat("#24232b"), 0, 0, 0, 12));
  g.add(cyl(1.4, 1.7, 0.5, stone, 0, 0.2, 0, 8));
  const ob = mesh(new THREE.CylinderGeometry(0.35, 0.75, 5.2, 4), stone, 0, 0.7 + 2.6, 0);
  ob.rotation.y = Math.PI / 4;
  g.add(ob);
  g.add(mesh(new THREE.ConeGeometry(0.36, 0.7, 4), gold, 0, 0.7 + 5.2 + 0.35, 0).rotateY(Math.PI / 4));
  const drawPlate = (c) => {
    c.clearRect(0, 0, 512, 128);
    c.font = "bold 84px 'Space Grotesk', sans-serif"; c.textAlign = "center"; c.fillStyle = "#e8c44a";
    c.shadowColor = "#e8c44a"; c.shadowBlur = 18; c.fillText("D22-soso", 256, 96, 490);
  };
  const plate = canvasTex(512, 128, drawPlate);
  document.fonts?.ready.then(() => { drawPlate(plate.g); plate.tex.needsUpdate = true; });
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: plate.tex, transparent: true, depthWrite: false, toneMapped: false }));
  sprite.scale.set(6.4, 1.6, 1); sprite.position.y = 8.3;
  g.add(sprite);
  const rings = [["#e8c44a", 1.6, 0], ["#8b5cf6", 2.1, 1], ["#e8c44a", 2.6, 2]].map(([c, r, i]) => {
    const m = mesh(new THREE.TorusGeometry(r, 0.035, 6, 64), glow(c, 2), 0, 4.2, 0, false);
    g.add(m);
    return { m, i };
  });
  return {
    g, plate, sprite,
    anim(t) {
      rings.forEach(({ m, i }) => { m.rotation.x = Math.PI / 2 + Math.sin(t * 0.5 + i) * 0.5; m.rotation.y = t * (0.3 + i * 0.15); });
      sprite.position.y = 8.3 + Math.sin(t) * 0.15;
    },
  };
}

function scout() {
  const g = new THREE.Group();
  const body = new THREE.Group();
  body.add(mesh(new THREE.SphereGeometry(0.42, 10, 8), mat("#6b5f3f", { metal: 0.3 }), 0, 0.9, 0));
  body.add(mesh(new THREE.BoxGeometry(0.5, 0.12, 0.2), glow("#e8c44a", 2), 0, 1.0, 0.33));
  body.add(mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 4), mat("#222"), -0.18, 1.45, -0.1));
  body.add(mesh(new THREE.SphereGeometry(0.05, 6, 4), glow("#ef4444", 2), -0.18, 1.72, -0.1, false));
  g.add(body);
  const legs = [-0.18, 0.18].map((x) => { const l = mesh(new THREE.BoxGeometry(0.12, 0.5, 0.14), mat("#2b2b2b"), x, 0.35, 0); g.add(l); return l; });
  const ring = mesh(new THREE.RingGeometry(0.62, 0.72, 32), new THREE.MeshBasicMaterial({ color: "#86efac", transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false }), 0, 0.03, 0, false);
  ring.rotation.x = -Math.PI / 2;
  g.add(ring);
  return { g, body, legs, ring };
}

function artifactMesh() {
  const g = new THREE.Group();
  const gem = mesh(new THREE.OctahedronGeometry(0.32), mat("#4b5563", { emissive: "#38bdf8", ei: 0.25, rough: 0.3 }), 0, 0.85, 0);
  g.add(gem);
  const beam = mesh(new THREE.CylinderGeometry(0.06, 0.25, 6, 8, 1, true), new THREE.MeshBasicMaterial({ color: "#e8c44a", transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }), 0, 3.6, 0, false);
  g.add(beam);
  return { g, gem, beam };
}

/* ---------- world ---------- */
export function createWorld({ canvas, sectors, artifacts, reduced, onHover, onClick, onCameraUser, onFrame }) {
  const mobile = matchMedia("(max-width: 760px)").matches || matchMedia("(pointer: coarse)").matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile && devicePixelRatio < 2, powerPreference: mobile ? "default" : "high-performance" });
  // Quality tiers. 2: crisp + soft shadows, 1: lighter pixels + small shadow map, 0: no shadows, 1x pixels.
  // Phones start at 1 without shadows; any device steps down if it can't hold its frame rate.
  let tier = mobile || LIGHT ? 1 : 2;
  const shadowsAllowed = !mobile;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.45;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false; // the scene is mostly still; shadows refresh a few times a second

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#07080b");
  scene.fog = new THREE.Fog("#07080b", 120, 220);

  const hemi = new THREE.HemisphereLight("#e4ddff", "#3a2a16", 1.7);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight("#ffdcae", 2.7);
  sun.position.set(-30, 50, 25);
  sun.castShadow = shadowsAllowed;
  Object.assign(sun.shadow.camera, { left: -36, right: 36, top: 36, bottom: -36, near: 1, far: 140 });
  sun.shadow.bias = -0.0008;
  scene.add(sun);
  const rim = new THREE.DirectionalLight("#8b5cf6", 0.6);
  rim.position.set(30, 10, -30);
  scene.add(rim);

  const world = new THREE.Group();
  scene.add(world);
  const r = rng(22);

  /* Island: hex tiles on top, a jagged rock keel below. */
  const sectorPos = sectors.map((s) => polar(s.angle, SECTOR_R));
  const tileH = (x, z) => {
    const d = Math.hypot(x, z);
    if (d < 6.5) return PLAZA_TOP;
    for (const p of sectorPos) if (Math.hypot(x - p.x, z - p.z) < 6.2) return PLATEAU_TOP;
    return BASE_TOP + ((Math.sin(x * 0.7) + Math.cos(z * 0.9)) * 0.5 + 0.5) * 0.12;
  };
  const hex = 1.05, tiles = [];
  for (let q = -32; q <= 32; q++) for (let rr = -32; rr <= 32; rr++) {
    const x = hex * Math.sqrt(3) * (q + rr / 2), z = hex * 1.5 * rr;
    if (Math.hypot(x, z) < R - 0.6) tiles.push([x, z]);
  }
  const tileGeo = new THREE.CylinderGeometry(hex * 0.98, hex * 0.98, 1, 6);
  tileGeo.translate(0, -0.5, 0);
  const tileMesh = new THREE.InstancedMesh(tileGeo, new THREE.MeshLambertMaterial({ flatShading: true }), tiles.length);
  tileMesh.receiveShadow = true;
  const m4 = new THREE.Matrix4(), col = new THREE.Color(), base = new THREE.Color();
  tiles.forEach(([x, z], i) => {
    const h = tileH(x, z) + 6;
    m4.makeScale(1, h, 1); m4.setPosition(x, tileH(x, z), z);
    tileMesh.setMatrixAt(i, m4);
    const d = Math.hypot(x, z);
    base.set(d < 6.5 ? "#4a4554" : "#3b3d46").offsetHSL(0, 0, (r() - 0.5) * 0.03);
    let best = null, bd = 1e9;
    sectorPos.forEach((p, k) => { const dd = Math.hypot(x - p.x, z - p.z); if (dd < bd) { bd = dd; best = k; } });
    if (bd < 9) base.lerp(col.set(sectors[best].ground), clamp(1 - (bd - 4) / 5, 0, 1));
    if (d > R - 2.4) base.multiplyScalar(0.7);
    tileMesh.setColorAt(i, base);
  });
  world.add(tileMesh);

  const keelGeo = new THREE.ConeGeometry(R + 0.4, 22, 14, 4, true);
  const pos = keelGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    if (y < 10.9) { pos.setX(i, pos.getX(i) * (0.85 + r() * 0.3)); pos.setZ(i, pos.getZ(i) * (0.85 + r() * 0.3)); pos.setY(i, y + (r() - 0.5) * 2); }
  }
  keelGeo.computeVertexNormals();
  const keel = mesh(keelGeo, mat("#1b1a1f", { side: THREE.DoubleSide }), 0, -6 - 11, 0, false);
  keel.rotation.x = Math.PI;
  world.add(keel);
  const deco = new THREE.Group();
  for (let i = 0; i < 9; i++) {
    const a = r() * Math.PI * 2, d = R + 4 + r() * 8;
    const f = mesh(new THREE.DodecahedronGeometry(0.6 + r() * 1.4, 0), mat("#26242c"), Math.cos(a) * d, -2 - r() * 8, Math.sin(a) * d, false);
    deco.add(f);
  }
  world.add(deco);
  // Tactical grid far below.
  const grid = new THREE.PolarGridHelper(90, 12, 8, 64, "#2a2440", "#16151c");
  grid.position.y = -34;
  world.add(grid);
  // Stars.
  const starGeo = new THREE.BufferGeometry();
  const sp = new Float32Array(900);
  for (let i = 0; i < 300; i++) {
    const a = r() * Math.PI * 2, e = r() * 1.2 - 0.2, d = 150;
    sp.set([Math.cos(a) * Math.cos(e) * d, Math.sin(e) * d, Math.sin(a) * Math.cos(e) * d], i * 3);
  }
  starGeo.setAttribute("position", new THREE.BufferAttribute(sp, 3));
  scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: "#c8c2e8", size: 1.2, sizeAttenuation: false, fog: false })));

  /* Glowing pathways: a ring road plus a spoke to every sector. */
  const pathMat = new THREE.MeshBasicMaterial({ color: "#e8c44a", transparent: true, opacity: 0.22, depthWrite: false });
  const road = new THREE.Mesh(new THREE.RingGeometry(ROAD_R - 0.35, ROAD_R + 0.35, 96), pathMat);
  road.rotation.x = -Math.PI / 2; road.position.y = BASE_TOP + 0.13;
  world.add(road);
  const pulses = [];
  sectors.forEach((s, i) => {
    const a = polar(s.angle, 6.4), b = polar(s.angle, APPROACH_R + 0.5);
    const len = a.distanceTo(b);
    const strip = new THREE.Mesh(new THREE.PlaneGeometry(0.55, len), new THREE.MeshBasicMaterial({ color: s.accent, transparent: true, opacity: 0.35, depthWrite: false }));
    strip.rotation.x = -Math.PI / 2; strip.rotation.z = deg(s.angle) - Math.PI / 2;
    strip.position.set((a.x + b.x) / 2, BASE_TOP + 0.14, (a.z + b.z) / 2);
    world.add(strip);
    for (let k = 0; k < 3; k++) pulses.push({ a, b, o: k / 3 + i * 0.07, color: new THREE.Color(s.accent).multiplyScalar(1.6) });
  });
  // All pathway pulses draw in a single call.
  const pulseMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.14, 6, 4), new THREE.MeshBasicMaterial({ toneMapped: false }), pulses.length);
  pulses.forEach((p, i) => pulseMesh.setColorAt(i, p.color));
  pulseMesh.frustumCulled = false;
  pulseMesh.visible = !reduced;
  world.add(pulseMesh);
  const pulsePos = new THREE.Vector3(), pulseM = new THREE.Matrix4();

  /* Monument, sectors, artifacts, scout. */
  const mon = monument();
  mon.g.position.y = PLAZA_TOP;
  world.add(mon.g);

  const pickables = [];
  const sectorObjs = sectors.map((s, i) => {
    const built = BUILD[s.id](s.accent);
    const p = sectorPos[i];
    built.g.position.set(p.x, PLATEAU_TOP, p.z);
    built.g.rotation.y = Math.atan2(-p.x, -p.z); // front faces the centre
    const sign = billboard(s.key, s.accent);
    sign.pole.position.z = SIGN.z;
    built.g.add(sign.pole);
    world.add(built.g);
    built.g.updateMatrixWorld(true);
    const signAt = built.g.localToWorld(new THREE.Vector3(0, 0, SIGN.z));
    sign.head.position.set(signAt.x, PLATEAU_TOP + SIGN.bottom + sign.h / 2 + 0.2, signAt.z);
    if (mobile) sign.head.scale.setScalar(1.3);
    world.add(sign.head);
    const hl = new THREE.Mesh(new THREE.RingGeometry(5.3, 5.6, 64), new THREE.MeshBasicMaterial({ color: s.accent, transparent: true, opacity: 0, depthWrite: false }));
    hl.rotation.x = -Math.PI / 2; hl.position.set(p.x, PLATEAU_TOP + 0.06, p.z);
    world.add(hl);
    const hit = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 9, 12), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.set(p.x, PLATEAU_TOP + 4.5, p.z);
    hit.userData.hit = { type: "sector", id: s.id };
    world.add(hit); pickables.push(hit);
    return { ...built, s, p, hl, head: sign.head, signH: sign.h, approach: polar(s.angle, APPROACH_R) };
  });

  mergeStatic(mon.g, mon.anim, world);
  for (const o of sectorObjs) mergeStatic(o.g, o.anim, world);

  const pedestals = new THREE.Group();
  world.add(pedestals);
  const artifactObjs = artifacts.map((a) => {
    const o = artifactMesh();
    const p = polar(a.angle, a.r);
    pedestals.add(cyl(0.3, 0.38, 0.35, mat("#2a2a30"), p.x, tileH(p.x, p.z), p.z, 6));
    o.g.position.set(p.x, tileH(p.x, p.z), p.z);
    world.add(o.g);
    const hit = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 6), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.set(p.x, tileH(p.x, p.z) + 1, p.z);
    hit.userData.hit = { type: "artifact", id: a.id };
    world.add(hit); pickables.push(hit);
    return { ...o, a, p, found: false, lit: 0 };
  });

  mergeStatic(pedestals, null, world);
  mergeStatic(deco, null, world);

  const sc = scout();
  sc.g.position.set(0, PLAZA_TOP, 4.5);
  world.add(sc.g);
  let route = [], onArrive = null, walkT = 0;
  const pingRing = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.65, 32), new THREE.MeshBasicMaterial({ color: "#e8c44a", transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
  pingRing.rotation.x = -Math.PI / 2;
  world.add(pingRing);
  let ping = 1;

  const groundY = (x, z) => tileH(x, z);
  function planRoute(to) {
    const from = sc.g.position.clone();
    const pts = [];
    const fa = Math.atan2(-from.z, from.x), ta = Math.atan2(-to.z, to.x);
    const fr = Math.hypot(from.x, from.z), tr = Math.hypot(to.x, to.z);
    let da = ta - fa; while (da > Math.PI) da -= Math.PI * 2; while (da < -Math.PI) da += Math.PI * 2;
    if (Math.abs(da) > 0.35 || (fr > ROAD_R + 2 && tr > ROAD_R + 2)) {
      if (fr > 2) pts.push(polarRad(fa, ROAD_R));
      const steps = Math.ceil(Math.abs(da) / 0.12);
      const sa = fr > 2 ? fa : ta;
      for (let i = 1; i <= steps; i++) pts.push(polarRad(sa + (da * i) / steps, ROAD_R));
    }
    pts.push(to.clone());
    route = pts.map((p) => new THREE.Vector3(p.x, groundY(p.x, p.z), p.z));
  }
  const polarRad = (a, rr) => new THREE.Vector3(Math.cos(a) * rr, 0, -Math.sin(a) * rr);

  /* ---------- camera ---------- */
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -200, 400);
  const cur = { az: deg(200), el: deg(14), zoom: 2.6, tx: 0, tz: 0, ty: 3, shiftX: 0, shiftY: 0 };
  // Tall phone screens look down more steeply so the island fills the height instead of leaving empty floor.
  const OV = matchMedia("(max-aspect-ratio: 4/5)").matches ? { el: deg(50), ty: 6 } : { el: deg(36), ty: 7.5 };
  const goal = { az: deg(225), el: OV.el, zoom: 1, tx: 0, tz: 0, ty: OV.ty, shiftX: 0, shiftY: 0 };
  if (reduced) Object.assign(cur, goal);
  let introT = reduced ? 1 : 0;
  let vAz = 0, lastUser = performance.now();
  let width = 1, height = 1;

  function resize() {
    width = canvas.clientWidth; height = canvas.clientHeight;
    renderer.setSize(width, height, false);
  }
  function applyCamera() {
    const aspect = width / height;
    const fit = aspect < 1 ? 49 / aspect : 44; // whole island in view, edge to edge on phones
    const h = fit / cur.zoom, w = h * aspect;
    const ox = cur.shiftX * w, oy = cur.shiftY * h;
    camera.left = -w / 2 - ox; camera.right = w / 2 - ox; camera.top = h / 2 - oy; camera.bottom = -h / 2 - oy;
    camera.updateProjectionMatrix();
    const d = 100;
    camera.position.set(cur.tx + Math.sin(cur.az) * Math.cos(cur.el) * d, cur.ty + Math.sin(cur.el) * d, cur.tz + Math.cos(cur.az) * Math.cos(cur.el) * d);
    camera.lookAt(cur.tx, cur.ty, cur.tz);
  }

  /* ---------- input ---------- */
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function pick(cx, cy) {
    const rect = canvas.getBoundingClientRect();
    ndc.set(((cx - rect.left) / rect.width) * 2 - 1, -((cy - rect.top) / rect.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const h = ray.intersectObjects(pickables, false)[0];
    return h ? h.object.userData.hit : null;
  }
  const ptrs = new Map();
  let drag = null, pinch = null, hover = null, hoverAt = null;
  const userMoved = () => { lastUser = performance.now(); onCameraUser?.(); };

  canvas.addEventListener("pointerdown", (e) => {
    canvas.setPointerCapture(e.pointerId);
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.size === 2) {
      const [a, b] = [...ptrs.values()];
      pinch = { d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, z0: goal.zoom, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
      drag = null; return;
    }
    if (ptrs.size > 2) return;
    drag = { x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, moved: false, pan: e.button === 2 || e.shiftKey, t: performance.now() };
    vAz = 0;
  });
  canvas.addEventListener("pointermove", (e) => {
    if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && ptrs.size >= 2) {
      const [a, b] = [...ptrs.values()];
      goal.zoom = clamp(pinch.z0 * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d0, 0.7, 3.6);
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      panBy(mx - pinch.mx, my - pinch.my); pinch.mx = mx; pinch.my = my;
      userMoved(); return;
    }
    if (!drag) {
      if (e.pointerType === "mouse") {
        // Mice can report hundreds of moves a second; raycast at most once per frame.
        const first = !hoverAt;
        hoverAt = { x: e.clientX, y: e.clientY };
        if (first) requestAnimationFrame(() => {
          const h = pick(hoverAt.x, hoverAt.y);
          hoverAt = null;
          if ((h && h.id) !== (hover && hover.id)) { hover = h; onHover?.(h); }
          canvas.style.cursor = h ? "pointer" : "grab";
        });
      }
      return;
    }
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    drag.x = e.clientX; drag.y = e.clientY;
    if (Math.hypot(drag.x - drag.x0, drag.y - drag.y0) > 6) drag.moved = true;
    if (!drag.moved) return;
    canvas.style.cursor = "grabbing";
    if (drag.pan) panBy(dx, dy);
    else {
      const k = 0.0065;
      goal.az -= dx * k; vAz = -dx * k;
      goal.el = clamp(goal.el + dy * 0.004, deg(18), deg(62));
    }
    userMoved();
  });
  const end = (e) => {
    ptrs.delete(e.pointerId);
    if (pinch) { if (ptrs.size < 2) { pinch = null; drag = null; } return; }
    if (!drag) return;
    const d = drag; drag = null;
    canvas.style.cursor = "grab";
    if (!d.moved && e.type === "pointerup") onClick?.(pick(e.clientX, e.clientY), e);
  };
  canvas.addEventListener("pointerup", end);
  canvas.addEventListener("pointercancel", end);
  canvas.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse" && hover) { hover = null; onHover?.(null); } });
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    goal.zoom = clamp(goal.zoom * Math.exp(-e.deltaY * 0.0015), 0.7, 3.6);
    userMoved();
  }, { passive: false });

  function panBy(dx, dy) {
    const h = (camera.top - camera.bottom), unit = h / height;
    const right = new THREE.Vector3(Math.cos(cur.az), 0, -Math.sin(cur.az));
    const fwd = new THREE.Vector3(-Math.sin(cur.az), 0, -Math.cos(cur.az));
    goal.tx -= (right.x * dx - fwd.x * dy / Math.sin(cur.el)) * unit;
    goal.tz -= (right.z * dx - fwd.z * dy / Math.sin(cur.el)) * unit;
    const d = Math.hypot(goal.tx, goal.tz);
    if (d > R * 0.8) { goal.tx *= (R * 0.8) / d; goal.tz *= (R * 0.8) / d; }
  }

  /* ---------- loop ---------- */
  let running = true;
  let lastRender = 0, background = "none", shadowTick = 0;
  const samples = [];
  const settled = () =>
    Math.abs(cur.az - goal.az) + Math.abs(cur.el - goal.el) + Math.abs(cur.zoom - goal.zoom) * 0.2 +
    (Math.abs(cur.tx - goal.tx) + Math.abs(cur.tz - goal.tz)) * 0.05 + Math.abs(cur.shiftX - goal.shiftX) + Math.abs(cur.shiftY - goal.shiftY) < 0.003;
  // Frame-rate governor: full speed only while something is actually moving.
  function fpsCap() {
    if (background === "list") return 0;
    if (drag || pinch || introT < 1 || route.length || ping < 1 || performance.now() - lastUser < 1500 || !settled()) return 60;
    if (background === "exhibit") return mobile ? 12 : 24;
    return reduced ? 8 : mobile ? 24 : 30;
  }
  const tmp = new THREE.Vector3();
  const gemFound = glow("#e8c44a", 2);
  const gemHover = mat("#64748b", { emissive: "#38bdf8", ei: 0.9, rough: 0.3 });
  const gemIdle = mat("#4b5563", { emissive: "#38bdf8", ei: 0.25, rough: 0.3 });
  function frame() {
    requestAnimationFrame(frame);
    if (!running) return;
    const now = performance.now();
    const fps = fpsCap();
    if (!fps || now - lastRender < 1000 / fps - 4) return;
    const raw = lastRender ? Math.min((now - lastRender) / 1000, 0.25) : 0.016;
    // Adaptive quality: if a device can't hold ~40fps while moving, step down a tier.
    if (fps === 60 && lastRender && tier > 0) {
      samples.push(now - lastRender);
      if (samples.length >= 90) {
        const median = samples.sort((a, b) => a - b)[45];
        samples.length = 0;
        if (median > 26) { tier--; applyTier(); }
      }
    }
    lastRender = now;
    const dt = Math.min(raw, 0.05);
    const t = reduced ? 0 : now / 1000;

    if (introT < 1) {
      introT = Math.min(1, introT + raw / 3.2);
      const k = ease(introT);
      cur.az = lerp(deg(200), goal.az, k); cur.el = lerp(deg(14), goal.el, k); cur.zoom = lerp(2.6, goal.zoom, k); cur.ty = lerp(3, goal.ty, k);
    } else {
      if (!drag && !reduced) { goal.az += vAz * raw * 60; vAz *= Math.pow(0.92, raw * 60); if (Math.abs(vAz) < 1e-4) vAz = 0; }
      if (!reduced && !drag && !pinch && now - lastUser > 9000 && !route.length && idleSpin && background === "none") { cur.az += dt * 0.04; goal.az += dt * 0.04; }
      const k = reduced ? 1 : 1 - Math.exp(-raw * 5);
      for (const key of ["az", "el", "zoom", "tx", "tz", "ty", "shiftX", "shiftY"]) cur[key] = lerp(cur[key], goal[key], k);
    }
    applyCamera();

    mon.anim(t);
    mon.sprite.material.opacity = lerp(mon.sprite.material.opacity, selected ? 0 : 1, 0.1);
    for (const o of sectorObjs) {
      o.head.rotation.y = cur.az; o.head.rotation.x = -cur.el;
      o.anim(t, dt);
      const want = o.s.id === selected ? 0.95 : o.s.id === (hover && hover.id) ? 0.7 : 0;
      o.hl.material.opacity = lerp(o.hl.material.opacity, want * (0.75 + 0.25 * Math.sin(t * 4)), 0.2);
      o.hl.visible = o.hl.material.opacity > 0.01;
    }
    if (!reduced) {
      pulses.forEach((p, i) => {
        pulsePos.lerpVectors(p.a, p.b, (t * 0.25 + p.o) % 1); pulsePos.y = BASE_TOP + 0.35;
        pulseMesh.setMatrixAt(i, pulseM.makeTranslation(pulsePos.x, pulsePos.y, pulsePos.z));
      });
      pulseMesh.instanceMatrix.needsUpdate = true;
    }
    for (const a of artifactObjs) {
      a.gem.rotation.y = t * (a.found ? 1.2 : 0.4);
      a.gem.position.y = 0.85 + Math.sin(t * 1.5 + a.p.x) * (a.found ? 0.12 : 0.04);
      a.lit = lerp(a.lit, a.found ? 1 : 0, 0.05);
      a.gem.material = a.found ? gemFound : a.a.id === (hover && hover.id) ? gemHover : gemIdle;
      a.beam.material.opacity = a.lit * (0.18 + Math.sin(t * 2) * 0.05);
      a.beam.visible = a.lit > 0.01;
    }

    // Scout
    if (route.length) {
      const target = route[0];
      tmp.subVectors(target, sc.g.position); tmp.y = 0;
      const d = tmp.length(), step = (reduced ? 999 : 7.5) * dt;
      if (d <= step) {
        sc.g.position.copy(target); route.shift();
        if (!route.length) { ping = 0; pingRing.position.set(target.x, target.y + 0.05, target.z); const cb = onArrive; onArrive = null; cb?.(); }
      } else {
        sc.g.position.addScaledVector(tmp.normalize(), step);
        sc.g.position.y = lerp(sc.g.position.y, groundY(sc.g.position.x, sc.g.position.z), 0.3);
        const yaw = Math.atan2(tmp.x, tmp.z);
        let dy = yaw - sc.g.rotation.y; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2;
        sc.g.rotation.y += dy * 0.25;
      }
      walkT += dt * 10;
    }
    const walking = route.length > 0 && !reduced;
    sc.legs[0].rotation.x = walking ? Math.sin(walkT) * 0.6 : 0;
    sc.legs[1].rotation.x = walking ? -Math.sin(walkT) * 0.6 : 0;
    sc.body.position.y = walking ? Math.abs(Math.sin(walkT)) * 0.08 : Math.sin(t * 2) * 0.03;
    sc.ring.material.opacity = 0.6 + Math.sin(t * 4) * 0.3;
    if (ping < 1) { ping += dt / 0.7; pingRing.scale.setScalar(1 + ping * 3); pingRing.material.opacity = 1 - ping; } else pingRing.material.opacity = 0;

    // Artifacts light up as the scout passes.
    for (const a of artifactObjs) {
      if (!a.found && Math.hypot(sc.g.position.x - a.p.x, sc.g.position.z - a.p.z) < 2.6) discover(a.a.id, true);
    }

    if (renderer.shadowMap.enabled && shadowTick++ % 6 === 0) renderer.shadowMap.needsUpdate = true;
    renderer.render(scene, camera);
    onFrame?.();
  }

  let selected = null, idleSpin = true, onDiscover = null;
  function discover(id, byScout) {
    const a = artifactObjs.find((o) => o.a.id === id);
    if (!a || a.found) return;
    a.found = true;
    onDiscover?.(a.a, byScout);
  }

  function applyTier() {
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, [1, 1.5, 2][tier]));
    renderer.shadowMap.enabled = shadowsAllowed && tier > 0;
    sun.castShadow = renderer.shadowMap.enabled;
    const size = tier === 2 ? 2048 : 1024;
    if (sun.shadow.mapSize.x !== size) { sun.shadow.mapSize.set(size, size); sun.shadow.map?.dispose(); sun.shadow.map = null; }
    renderer.shadowMap.needsUpdate = true;
    mats.forEach((m) => (m.needsUpdate = true));
    resize();
  }
  applyTier();

  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", () => { running = !document.hidden; lastRender = 0; samples.length = 0; });
  resize(); applyCamera(); frame();

  const proj = new THREE.Vector3(), camUp = new THREE.Vector3();
  const st = {
    R, scout: {},
    sectors: sectorObjs.map((o) => ({ id: o.s.id, x: o.p.x, z: o.p.z, accent: o.s.accent })),
    artifacts: artifactObjs.map((a) => ({ id: a.a.id, x: a.p.x, z: a.p.z, found: a.found })),
  };
  return {
    /* Camera framing for a sector; shift moves the subject away from an open exhibit panel. */
    focusSector(id, { shiftX = 0, shiftY = 0, zoom = 2.3 } = {}) {
      const o = sectorObjs.find((x) => x.s.id === id);
      if (!o) return;
      // Aim between the building and the top of its sign so the whole set (sign included) sits in frame.
      goal.tx = o.p.x * 0.92; goal.tz = o.p.z * 0.92; goal.ty = PLATEAU_TOP + (SIGN.bottom + o.signH) * 0.45;
      // Three-quarter view from the centre side, swung off-axis so the monument never blocks the facade.
      let az = Math.atan2(-o.p.x, -o.p.z) + 0.75;
      while (az - cur.az > Math.PI) az -= Math.PI * 2;
      while (az - cur.az < -Math.PI) az += Math.PI * 2;
      goal.az = az; goal.el = deg(34); goal.zoom = zoom; goal.shiftX = shiftX; goal.shiftY = shiftY;
      introT = 1; vAz = 0;
    },
    frame({ shiftX = 0, shiftY = 0 } = {}) { goal.shiftX = shiftX; goal.shiftY = shiftY; },
    overview() {
      goal.tx = 0; goal.tz = 0; goal.ty = OV.ty; goal.zoom = 1; goal.el = OV.el; goal.shiftX = 0; goal.shiftY = 0;
    },
    zoomBy(f) { goal.zoom = clamp(goal.zoom * f, 0.7, 3.6); userMoved(); },
    rotateBy(a) { goal.az += a; userMoved(); },
    lookAt(x, z) { goal.tx = clamp(x, -R, R); goal.tz = clamp(z, -R, R); userMoved(); },
    sendScoutToSector(id, cb) {
      const o = sectorObjs.find((x) => x.s.id === id);
      planRoute(o.approach); onArrive = cb;
    },
    sendScoutToArtifact(id, cb) {
      const a = artifactObjs.find((x) => x.a.id === id);
      const dir = a.p.clone().normalize();
      planRoute(a.p.clone().sub(dir.multiplyScalar(1.2))); onArrive = cb;
    },
    setSelected(id) { selected = id; },
    /* "none" | "exhibit" (world partly covered: run slower) | "list" (world hidden: stop) */
    setBackground(v) { background = v; samples.length = 0; },
    setIdleSpin(on) { idleSpin = on; },
    onDiscover(cb) { onDiscover = cb; },
    restoreFound(ids) { for (const a of artifactObjs) if (ids.includes(a.a.id)) { a.found = true; a.lit = 1; } },
    project(kind, id) {
      let v;
      if (kind === "sector" || kind === "signBase") {
        // The board faces the camera square-on, so its edges sit along the camera's up axis.
        const o = sectorObjs.find((x) => x.s.id === id), up = camUp.set(0, 1, 0).applyQuaternion(camera.quaternion);
        v = proj.copy(o.head.position).addScaledVector(up, ((o.signH / 2) * o.head.scale.y + 0.5) * (kind === "sector" ? 1 : -1));
      }
      else { const a = artifactObjs.find((x) => x.a.id === id); v = proj.set(a.p.x, a.g.position.y + 2, a.p.z); }
      v.project(camera);
      return { x: (v.x * 0.5 + 0.5) * width, y: (-v.y * 0.5 + 0.5) * height, z: v.z };
    },
    state() {
      st.az = cur.az; st.zoom = cur.zoom; st.tx = cur.tx; st.tz = cur.tz;
      st.scout.x = sc.g.position.x; st.scout.z = sc.g.position.z;
      artifactObjs.forEach((a, i) => (st.artifacts[i].found = a.found));
      return st;
    },
  };
}

export function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch { return false; }
}
