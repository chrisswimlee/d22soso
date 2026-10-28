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
    const g = new THREE.Group();
    const stone = mat("#4a4658"), stone2 = mat("#3a3748"), dark = mat("#1c1b24");
    g.add(cyl(4.4, 4.7, 0.35, stone2, 0, 0, 0, 16));
    const field = canvasTex(256, 256, (c, w, h) => {
      c.fillStyle = "#1d2a22"; c.fillRect(0, 0, w, h);
      c.strokeStyle = "rgba(139,92,246,.45)"; c.lineWidth = 2;
      for (let i = 0; i <= w; i += 32) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i, h); c.stroke(); c.beginPath(); c.moveTo(0, i); c.lineTo(w, i); c.stroke(); }
      c.strokeStyle = "rgba(232,196,74,.7)"; c.lineWidth = 4; c.beginPath(); c.arc(w / 2, h / 2, 60, 0, 7); c.stroke();
    });
    const f = mesh(new THREE.CylinderGeometry(3, 3, 0.06, 32), new THREE.MeshLambertMaterial({ map: field.tex }), 0, 0.38, 0);
    g.add(f);
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a)) - Math.PI / 2) < 0.35) continue; // gate faces the centre
      const s = box(1.2, 1 + (i % 2) * 0.35, 0.9, i % 2 ? stone : stone2, 0, 0.35, 0);
      s.position.x = Math.cos(a) * 3.7; s.position.z = Math.sin(a) * 3.7;
      s.rotation.y = -a + Math.PI / 2;
      g.add(s);
    }
    // Trophy on a plinth with a holo ring.
    g.add(box(0.7, 0.6, 0.7, dark, 0, 0.4, 0));
    const pts = [[0, 0], [0.35, 0], [0.12, 0.15], [0.1, 0.5], [0.4, 0.8], [0.45, 1.1], [0, 1.0]].map(([x, y]) => new THREE.Vector2(x, y));
    const cup = mesh(new THREE.LatheGeometry(pts, 10), mat("#d4af37", { metal: 0.8, rough: 0.3, emissive: "#3a2a05" }), 0, 1.0, 0);
    g.add(cup);
    const ring = mesh(new THREE.TorusGeometry(1.1, 0.04, 6, 40), glow(accent, 2.2), 0, 2.6, 0, false);
    ring.rotation.x = Math.PI / 2;
    g.add(ring);
    // Miniature units skirmishing on the field.
    const units = [];
    for (let i = 0; i < 4; i++) {
      const u = new THREE.Group();
      const team = i % 2 ? "#ea580c" : accent;
      u.add(box(0.5, 0.22, 0.34, mat("#2b2b33"), 0, 0, 0));
      u.add(box(0.26, 0.14, 0.22, mat(team, { emissive: team, ei: 0.4 }), 0, 0.22, 0));
      const barrel = box(0.32, 0.05, 0.05, dark, 0.22, 0.27, 0); u.add(barrel);
      u.position.y = 0.42;
      units.push({ u, phase: i * (Math.PI / 2), r: 1.4 + (i % 2) * 0.6 });
      g.add(u);
    }
    // Banners and floodlights.
    const flags = [];
    for (const sx of [-1, 1]) {
      g.add(cyl(0.06, 0.06, 3.2, dark, sx * 2.4, 0.35, 2.6, 6));
      const flag = mesh(new THREE.PlaneGeometry(0.9, 0.6), mat(accent, { side: THREE.DoubleSide, emissive: accent, ei: 0.3 }), sx * 2.85, 3.1, 2.6);
      flags.push(flag); g.add(flag);
      g.add(cyl(0.08, 0.1, 3.6, stone2, sx * 3.6, 0.35, -2.2, 6));
      g.add(box(0.5, 0.25, 0.3, glow("#fff4cc", 2), sx * 3.6, 3.95, -2.2));
    }
    return {
      g,
      anim(t) {
        ring.rotation.z = t * 0.6; ring.position.y = 2.6 + Math.sin(t * 1.5) * 0.12;
        cup.rotation.y = t * 0.4;
        for (const { u, phase, r } of units) {
          const a = t * 0.35 + phase;
          u.position.x = Math.cos(a) * r; u.position.z = Math.sin(a) * r;
          u.rotation.y = -a;
        }
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
    const wall = mat("#2f3a3d"), roof = mat("#1f2a2c"), dark = mat("#141a1c");
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
    // Two hands of floating cards over the anvil.
    g.add(box(1.4, 0.7, 0.8, dark, 0, 0.3, 1.7));
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
    return {
      g,
      anim(t) {
        cards.forEach((c, i) => {
          const hand = i < 2 ? -1 : 1, k = i % 2;
          c.position.set(hand * 0.75 + (k - 0.5) * 0.42, 2.0 + Math.sin(t * 1.6 + i) * 0.12, 1.7 + k * 0.05);
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
    const g = new THREE.Group();
    const r = rng(7);
    // A giant tabletop mid-draft.
    g.add(box(5.2, 0.5, 3.6, mat("#3b2a1e"), 0, 0, 0));
    g.add(box(5, 0.06, 3.4, mat("#1f3b2a"), 0, 0.5, 0));
    const colors = ["#e879f9", "#60a5fa", "#f5f0e1", "#22c55e", "#ef4444", "#111827"];
    for (let i = 0; i < 15; i++) {
      const x = -1.9 + (i % 5) * 0.95, z = -1 + Math.floor(i / 5) * 1.05;
      const card = box(0.62, 0.04, 0.86, mat(colors[i % colors.length], { emissive: colors[i % colors.length], ei: 0.12 }), x, 0.56, z);
      card.rotation.y = (r() - 0.5) * 0.2;
      g.add(card);
    }
    // The Cube, literally.
    const cube = new THREE.Group();
    cube.add(mesh(new THREE.BoxGeometry(1.1, 1.1, 1.1), mat("#2a1630", { opacity: 0.55, emissive: accent, ei: 0.25 }), 0, 0, 0, false));
    cube.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.1, 1.1, 1.1)), new THREE.LineBasicMaterial({ color: accent })));
    cube.position.set(0, 2.6, 0);
    g.add(cube);
    // Hedges, trees, flowers.
    for (const [x, z, w, d] of [[-3.2, 0, 0.6, 3.8], [3.2, 0, 0.6, 3.8], [0, -2.5, 6.8, 0.6]]) g.add(box(w, 0.7, d, mat("#2f5a2a"), x, 0, z));
    for (let i = 0; i < 7; i++) {
      const a = r() * Math.PI * 2, d = 3.6 + r() * 0.8;
      const x = Math.cos(a) * d, z = Math.sin(a) * d * 0.8 - 0.4;
      if (z > 1.8) continue;
      g.add(cyl(0.08, 0.1, 0.6, mat("#4a3420"), x, 0, z, 5));
      const h = 1.2 + r() * 0.8;
      g.add(mesh(new THREE.ConeGeometry(0.5 + r() * 0.2, h, 6), mat(r() < 0.5 ? "#2e6b35" : "#3f7d3a"), x, 0.6 + h / 2, z));
    }
    for (let i = 0; i < 14; i++) g.add(mesh(new THREE.SphereGeometry(0.08, 5, 4), glow(i % 2 ? accent : "#fde68a", 0.6), -2.8 + r() * 5.6, 0.1, 2 + r() * 0.6, false));
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
    const g = new THREE.Group();
    const metal = mat("#3a3a36", { metal: 0.5, rough: 0.5 }), dark = mat("#1a1a18");
    g.add(cyl(2.4, 2.6, 0.35, mat("#2a2924"), 0, 0, -0.6, 6));
    g.add(cyl(1.4, 1.7, 3.4, metal, 0, 0.35, -0.6, 6));
    for (const y of [1.2, 2.1, 3.0]) g.add(cyl(1.47, 1.47, 0.12, glow(accent, 1.4), 0, 0.35 + y, -0.6, 6));
    g.add(cyl(1.6, 1.4, 0.35, dark, 0, 3.75, -0.6, 6));
    const radar = new THREE.Group();
    radar.position.set(0, 4.3, -0.6);
    const rbowl = mesh(new THREE.SphereGeometry(0.7, 12, 6, 0, Math.PI * 2, 0, Math.PI / 3), mat("#c9c3b0", { side: THREE.DoubleSide, metal: 0.4 }), 0, 0.3, 0);
    rbowl.rotation.x = Math.PI / 2.4;
    radar.add(cyl(0.08, 0.12, 0.4, dark, 0, 0, 0, 6)); radar.add(rbowl);
    g.add(radar);
    const beacon = mesh(new THREE.SphereGeometry(0.16, 8, 6), glow(accent, 3), 0.9, 4.6, -1.2, false);
    g.add(cyl(0.03, 0.03, 0.8, dark, 0.9, 3.9, -1.2, 4)); g.add(beacon);
    // Landing pad with a circling drone.
    const pad = cyl(1.2, 1.2, 0.08, mat("#22211d"), 2.1, 0.35, 1.4, 6);
    g.add(pad);
    g.add(mesh(new THREE.TorusGeometry(0.85, 0.04, 4, 6), glow(accent, 1.2), 2.1, 0.46, 1.4, false).rotateX(Math.PI / 2));
    const drone = new THREE.Group();
    drone.add(box(0.5, 0.12, 0.5, dark, 0, 0, 0));
    for (const [x, z] of [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]]) drone.add(mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.02, 10), mat("#9ca3af", { opacity: 0.6 }), x, 0.1, z, false));
    drone.add(mesh(new THREE.SphereGeometry(0.06, 6, 4), glow("#22c55e", 2.5), 0, -0.06, 0.26, false));
    g.add(drone);
    // Console screens.
    for (const sx of [-1, 1]) {
      const s = box(0.9, 0.6, 0.06, glow("#8b5cf6", 0.7), sx * 1.9, 0.6, 0.6);
      s.rotation.y = sx * 0.5; s.rotation.x = -0.3;
      g.add(s);
    }
    return {
      g,
      anim(t) {
        radar.rotation.y = t * 0.9;
        beacon.scale.setScalar(0.8 + (Math.sin(t * 3) * 0.5 + 0.5) * 0.6);
        const a = t * 0.7;
        drone.position.set(2.1 + Math.cos(a) * 1.3, 2 + Math.sin(t * 2) * 0.2, 1.4 + Math.sin(a) * 1.3);
        drone.rotation.y = -a;
      },
    };
  },
};

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
  const groups = new Map();
  root.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh || !isStatic(o) || Array.isArray(o.material) || o.material.transparent || o.material.map || !o.material.visible) return;
    if (!groups.has(o.material)) groups.set(o.material, []);
    groups.get(o.material).push(o);
  });
  // Parts that move as one rigid piece (a gear and its teeth, a drone and its rotors) merge inside their group.
  for (const o of moving) {
    if (!o.isGroup) continue;
    const local = new Map();
    for (const c of o.children) {
      if (!c.isMesh || moving.has(c) || c.children.length || Array.isArray(c.material) || c.material.transparent || c.material.map) continue;
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
  for (const [material, list] of groups) {
    if (list.length < 2) continue;
    const merged = bake(list.map((m) => [m, m.matrixWorld]), material);
    for (const m of list) { m.removeFromParent(); m.geometry.dispose(); }
    into.add(merged);
  }
}

function bake(pairs, material) {
  const parts = pairs.map(([m, matrix]) => {
    const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
    for (const k of Object.keys(g.attributes)) if (k !== "position" && k !== "normal" && !(k === "uv" && material.map)) g.deleteAttribute(k);
    return g.applyMatrix4(matrix);
  });
  const count = parts.reduce((n, g) => n + g.attributes.position.count, 0);
  const pos = new Float32Array(count * 3), nor = new Float32Array(count * 3);
  let off = 0;
  const uv = material.map ? new Float32Array(count * 2) : null;
  for (const g of parts) {
    pos.set(g.attributes.position.array, off * 3); nor.set(g.attributes.normal.array, off * 3);
    uv?.set(g.attributes.uv.array, off * 2);
    off += g.attributes.position.count; g.dispose();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
  if (uv) geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
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
    c.clearRect(0, 0, 256, 128);
    c.font = "bold 84px 'Space Grotesk', sans-serif"; c.textAlign = "center"; c.fillStyle = "#e8c44a";
    c.shadowColor = "#e8c44a"; c.shadowBlur = 18; c.fillText("D22", 128, 96);
  };
  const plate = canvasTex(256, 128, drawPlate);
  document.fonts?.ready.then(() => { drawPlate(plate.g); plate.tex.needsUpdate = true; });
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: plate.tex, transparent: true, depthWrite: false, toneMapped: false }));
  sprite.scale.set(3.2, 1.6, 1); sprite.position.y = 8.3;
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
  renderer.toneMappingExposure = 1.3;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false; // the scene is mostly still; shadows refresh a few times a second

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#07080b");
  scene.fog = new THREE.Fog("#07080b", 120, 220);

  const hemi = new THREE.HemisphereLight("#c9d0ff", "#2a1f12", 1.35);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight("#ffe7c2", 2.2);
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
    base.set(d < 6.5 ? "#3a3744" : "#30333b").offsetHSL(0, 0, (r() - 0.5) * 0.03);
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
    world.add(built.g);
    const hl = new THREE.Mesh(new THREE.RingGeometry(5.3, 5.6, 64), new THREE.MeshBasicMaterial({ color: s.accent, transparent: true, opacity: 0, depthWrite: false }));
    hl.rotation.x = -Math.PI / 2; hl.position.set(p.x, PLATEAU_TOP + 0.06, p.z);
    world.add(hl);
    const hit = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 7, 12), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.set(p.x, PLATEAU_TOP + 3, p.z);
    hit.userData.hit = { type: "sector", id: s.id };
    world.add(hit); pickables.push(hit);
    return { ...built, s, p, hl, approach: polar(s.angle, APPROACH_R) };
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
  const goal = { az: deg(225), el: deg(36), zoom: 1, tx: 0, tz: 0, ty: 1.5, shiftX: 0, shiftY: 0 };
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
    const fit = aspect < 1 ? 56 / aspect : 44; // whole island in view
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

  const proj = new THREE.Vector3();
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
      goal.tx = o.p.x * 0.92; goal.tz = o.p.z * 0.92; goal.ty = PLATEAU_TOP + 1.2;
      // Three-quarter view from the centre side, swung off-axis so the monument never blocks the facade.
      let az = Math.atan2(-o.p.x, -o.p.z) + 0.75;
      while (az - cur.az > Math.PI) az -= Math.PI * 2;
      while (az - cur.az < -Math.PI) az += Math.PI * 2;
      goal.az = az; goal.el = deg(34); goal.zoom = zoom; goal.shiftX = shiftX; goal.shiftY = shiftY;
      introT = 1; vAz = 0;
    },
    frame({ shiftX = 0, shiftY = 0 } = {}) { goal.shiftX = shiftX; goal.shiftY = shiftY; },
    overview() {
      goal.tx = 0; goal.tz = 0; goal.ty = 1.5; goal.zoom = 1; goal.el = deg(36); goal.shiftX = 0; goal.shiftY = 0;
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
      if (kind === "sector") { const o = sectorObjs.find((x) => x.s.id === id); v = proj.set(o.p.x, PLATEAU_TOP + 6.2, o.p.z); }
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
