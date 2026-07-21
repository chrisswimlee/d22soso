/* Shared WebGL background: themed 3D fleets + fog-of-war scout (Three.js + GSAP) */
import * as THREE from "three";
import gsap from "gsap";

const reduced =
  typeof matchMedia !== "undefined" &&
  matchMedia("(prefers-reduced-motion: reduce)").matches;

const coarse =
  typeof matchMedia !== "undefined" && matchMedia("(pointer: coarse)").matches;

const shortLandscapeMq =
  typeof matchMedia !== "undefined"
    ? matchMedia("(max-height: 480px) and (orientation: landscape)")
    : null;

/* Fleet specs — ported from CSS 3D bg-scene (lightweight geometries) */
const FLEETS = {
  starcraft: [
    { kind: "cruiser", x: -3.2, y: 1.6, z: -2, s: 1.1, c: 0x60a5fa, spin: 0.12 },
    { kind: "ring", x: 3.0, y: 1.0, z: -3, s: 0.9, c: 0x38bdf8, spin: 0.2 },
    { kind: "tank", x: 2.6, y: -1.4, z: -1.5, s: 0.85, c: 0xa78bfa, spin: 0.08 },
    { kind: "crystal", x: -2.8, y: -1.6, z: -2.5, s: 0.55, c: 0x2dd4bf, spin: 0.15 },
    { kind: "tetra", x: 0.2, y: -1.8, z: -2, s: 0.6, c: 0x8b5cf6, spin: 0.18 },
    { kind: "spark", x: -1.0, y: 0.4, z: -4, s: 0.12, c: 0xcfe8ff, spin: 0 },
    { kind: "spark", x: 1.4, y: -0.2, z: -4.2, s: 0.1, c: 0xffffff, spin: 0 },
    { kind: "spark", x: -2.0, y: 0.8, z: -5, s: 0.08, c: 0xffffff, spin: 0 },
  ],
  "starcraft-v2": [
    { kind: "crystal", x: -2.6, y: 1.5, z: -2, s: 1.05, c: 0x2dd4bf, spin: 0.16 },
    { kind: "ring", x: 2.8, y: 0.8, z: -2.5, s: 1.0, c: 0xa8e6ff, spin: 0.22 },
    { kind: "crystal", x: 2.2, y: -1.5, z: -2, s: 0.7, c: 0x14b8a6, spin: 0.14 },
    { kind: "tetra", x: -2.0, y: -1.4, z: -3, s: 0.55, c: 0x67e8f9, spin: 0.18 },
    { kind: "ring", x: 0.2, y: 1.6, z: -3.5, s: 0.45, c: 0x2dd4bf, spin: 0.28 },
    { kind: "spark", x: -0.8, y: 0.2, z: -4, s: 0.12, c: 0xa8e6ff, spin: 0 },
    { kind: "spark", x: 1.6, y: -0.6, z: -4.2, s: 0.1, c: 0xffffff, spin: 0 },
  ],
  "starcraft-v3": [
    { kind: "tank", x: -2.8, y: 1.2, z: -2, s: 1.05, c: 0xea580c, spin: 0.1 },
    { kind: "cruiser", x: 2.6, y: -1.0, z: -2, s: 1.0, c: 0xb45309, spin: 0.12 },
    { kind: "tetra", x: 1.8, y: 1.5, z: -2.8, s: 0.65, c: 0xc2410c, spin: 0.16 },
    { kind: "ring", x: -2.2, y: -1.5, z: -3, s: 0.5, c: 0xfb923c, spin: 0.2 },
    { kind: "spark", x: 0.0, y: 0.4, z: -4, s: 0.14, c: 0xfdba74, spin: 0 },
    { kind: "spark", x: -1.4, y: -0.8, z: -4.2, s: 0.1, c: 0xea580c, spin: 0 },
    { kind: "spark", x: 2.0, y: 0.6, z: -4.5, s: 0.08, c: 0xffffff, spin: 0 },
  ],
  about: [
    { kind: "tetra", x: -3.4, y: 1.8, z: -2.5, s: 0.75, c: 0x8b5cf6, spin: 0.14 },
    { kind: "crystal", x: 3.2, y: -1.4, z: -2, s: 0.7, c: 0xd4af37, spin: 0.16 },
    { kind: "ring", x: -2.2, y: -1.6, z: -3, s: 0.5, c: 0xa78bfa, spin: 0.1 },
    { kind: "spark", x: 0.5, y: 0.6, z: -4, s: 0.1, c: 0xffffff, spin: 0 },
  ],
  cnc: [
    { kind: "star", x: -2.8, y: 1.4, z: -2, s: 0.9, c: 0x39ff14, spin: 0.12 },
    { kind: "blob", x: 2.8, y: -1.4, z: -2, s: 0.85, c: 0xe11d48, spin: 0.14 },
    { kind: "ring", x: 1.2, y: 1.2, z: -3, s: 0.55, c: 0x39ff14, spin: 0.22 },
    { kind: "ring", x: -1.6, y: -1.2, z: -3.5, s: 0.4, c: 0xc4a35a, spin: 0.18 },
  ],
  "cnc-v2": [
    { kind: "blob", x: -2.6, y: 1.3, z: -2, s: 1.0, c: 0xb42318, spin: 0.12 },
    { kind: "star", x: 2.6, y: -1.2, z: -2, s: 0.8, c: 0x7a868c, spin: 0.16 },
    { kind: "ring", x: 1.4, y: 1.4, z: -3, s: 0.5, c: 0xb42318, spin: 0.2 },
    { kind: "ring", x: -1.8, y: -1.5, z: -3.2, s: 0.38, c: 0x94a3b8, spin: 0.18 },
    { kind: "spark", x: 0.2, y: 0.2, z: -4, s: 0.1, c: 0xfca5a5, spin: 0 },
  ],
  "cnc-v3": [
    { kind: "star", x: -2.4, y: 1.2, z: -2, s: 0.95, c: 0xc4a035, spin: 0.1 },
    { kind: "tank", x: 2.6, y: -1.0, z: -2, s: 0.9, c: 0x6d7f8c, spin: 0.12 },
    { kind: "ring", x: 0.0, y: 1.5, z: -2.8, s: 0.6, c: 0xc4a035, spin: 0.18 },
    { kind: "ring", x: -2.0, y: -1.4, z: -3.2, s: 0.42, c: 0x94a3b8, spin: 0.16 },
    { kind: "spark", x: 1.6, y: 0.4, z: -4, s: 0.1, c: 0xfde68a, spin: 0 },
  ],
  warcraft: [
    { kind: "cross", x: 2.6, y: 1.4, z: -2, s: 0.95, c: 0xfbbf24, spin: 0.1 },
    { kind: "shield", x: -2.8, y: -1.2, z: -2, s: 0.9, c: 0x60a5fa, spin: 0.08 },
    { kind: "banner", x: 0.4, y: -1.6, z: -2.5, s: 0.65, c: 0xfbbf24, spin: 0.06 },
    { kind: "shield", x: 1.6, y: 1.6, z: -3.5, s: 0.4, c: 0xc48b3b, spin: 0.12 },
  ],
  "warcraft-v2": [
    { kind: "shield", x: -2.6, y: 1.3, z: -2, s: 1.05, c: 0x3b82f6, spin: 0.08 },
    { kind: "banner", x: 2.6, y: -1.1, z: -2, s: 0.85, c: 0xd4af37, spin: 0.1 },
    { kind: "cross", x: 0.2, y: 1.5, z: -2.8, s: 0.7, c: 0x60a5fa, spin: 0.12 },
    { kind: "shield", x: -1.8, y: -1.5, z: -3.2, s: 0.45, c: 0x1d4ed8, spin: 0.1 },
    { kind: "spark", x: 1.4, y: 0.3, z: -4, s: 0.1, c: 0xfde68a, spin: 0 },
  ],
  "warcraft-v3": [
    { kind: "banner", x: -2.4, y: 1.2, z: -2, s: 1.0, c: 0xb91c1c, spin: 0.1 },
    { kind: "cross", x: 2.6, y: -1.0, z: -2, s: 0.9, c: 0x84cc16, spin: 0.12 },
    { kind: "shield", x: 1.2, y: 1.5, z: -2.8, s: 0.55, c: 0xdc2626, spin: 0.14 },
    { kind: "spark", x: -1.6, y: -1.2, z: -3.5, s: 0.14, c: 0xa3e635, spin: 0 },
    { kind: "spark", x: 0.4, y: 0.2, z: -4, s: 0.12, c: 0xb91c1c, spin: 0 },
    { kind: "spark", x: 2.0, y: -1.6, z: -4.2, s: 0.1, c: 0xfef08a, spin: 0 },
  ],
  mtg: [
    { kind: "card", x: -2.8, y: 1.2, z: -2, s: 0.9, c: 0xe879f9, spin: 0.2 },
    { kind: "card", x: 2.8, y: -1.2, z: -2, s: 0.85, c: 0xfbbf24, spin: 0.18 },
    { kind: "pip", x: 1.8, y: 1.4, z: -3, s: 0.4, c: 0xe879f9, spin: 0.25 },
    { kind: "pip", x: -1.8, y: -1.4, z: -3, s: 0.35, c: 0xfbbf24, spin: 0.22 },
    { kind: "pip", x: 0, y: 0, z: -4, s: 0.22, c: 0xf472b6, spin: 0.3 },
  ],
  "mtg-v2": [
    { kind: "card", x: -2.6, y: 1.1, z: -2, s: 0.95, c: 0x86efac, spin: 0.16 },
    { kind: "card", x: 2.6, y: -1.1, z: -2, s: 0.9, c: 0xa8a29e, spin: 0.14 },
    { kind: "pip", x: 0.0, y: 1.5, z: -3, s: 0.38, c: 0x4ade80, spin: 0.22 },
    { kind: "pip", x: -1.6, y: -1.4, z: -3.2, s: 0.3, c: 0xa8a29e, spin: 0.2 },
    { kind: "blob", x: 1.8, y: 0.2, z: -3.5, s: 0.4, c: 0x14532d, spin: 0.1 },
  ],
  "mtg-v3": [
    { kind: "card", x: -2.6, y: 1.2, z: -2, s: 0.95, c: 0xf5f0e1, spin: 0.16 },
    { kind: "card", x: 2.6, y: -1.1, z: -2, s: 0.9, c: 0xeab308, spin: 0.18 },
    { kind: "pip", x: 0.2, y: 1.5, z: -3, s: 0.42, c: 0xfde68a, spin: 0.24 },
    { kind: "pip", x: -1.8, y: -1.3, z: -3.2, s: 0.32, c: 0xeab308, spin: 0.2 },
    { kind: "ring", x: 1.6, y: 0.4, z: -3.5, s: 0.4, c: 0xf5f0e1, spin: 0.14 },
  ],
  hearthstone: [
    { kind: "crystal", x: -2.8, y: 1.4, z: -2, s: 0.95, c: 0xf59e0b, spin: 0.14 },
    { kind: "card", x: 2.8, y: -1.2, z: -2, s: 0.9, c: 0xfde68a, spin: 0.16 },
    { kind: "crystal", x: 1.6, y: 1.4, z: -3, s: 0.5, c: 0xc2410c, spin: 0.2 },
    { kind: "ring", x: -2.0, y: -1.4, z: -3, s: 0.45, c: 0xfde68a, spin: 0.12 },
    { kind: "spark", x: 0.2, y: -1.8, z: -3.5, s: 0.15, c: 0xf59e0b, spin: 0 },
    { kind: "spark", x: 1.0, y: 0.6, z: -4, s: 0.12, c: 0xfbbf24, spin: 0 },
  ],
  "hearthstone-v2": [
    { kind: "crystal", x: -2.6, y: 1.3, z: -2, s: 1.0, c: 0x67e8f9, spin: 0.16 },
    { kind: "card", x: 2.6, y: -1.1, z: -2, s: 0.9, c: 0xf0f9ff, spin: 0.14 },
    { kind: "ring", x: 0.0, y: 1.5, z: -2.8, s: 0.55, c: 0xa5f3fc, spin: 0.22 },
    { kind: "crystal", x: -1.8, y: -1.4, z: -3.2, s: 0.5, c: 0x164e63, spin: 0.12 },
    { kind: "spark", x: 1.6, y: 0.4, z: -4, s: 0.12, c: 0xffffff, spin: 0 },
    { kind: "spark", x: -0.6, y: 0.2, z: -4.2, s: 0.1, c: 0x67e8f9, spin: 0 },
  ],
  "hearthstone-v3": [
    { kind: "card", x: -2.6, y: 1.2, z: -2, s: 0.95, c: 0x94a3b8, spin: 0.12 },
    { kind: "banner", x: 2.6, y: -1.1, z: -2, s: 0.8, c: 0xcbd5e1, spin: 0.1 },
    { kind: "crystal", x: 0.2, y: 1.5, z: -2.8, s: 0.55, c: 0x64748b, spin: 0.16 },
    { kind: "ring", x: -1.8, y: -1.4, z: -3.2, s: 0.42, c: 0xcbd5e1, spin: 0.14 },
    { kind: "spark", x: 1.4, y: 0.3, z: -4, s: 0.1, c: 0xe2e8f0, spin: 0 },
  ],
  poker: [
    { kind: "card", x: -2.8, y: 1.2, z: -2, s: 0.95, c: 0xe8e6e3, spin: 0.18 },
    { kind: "card", x: 2.8, y: -1.2, z: -2, s: 0.9, c: 0xe8e6e3, spin: 0.16 },
    { kind: "chip", x: 1.6, y: 1.4, z: -2.5, s: 0.55, c: 0xd4af37, spin: 0.3 },
    { kind: "chip", x: -2.0, y: -1.4, z: -2.5, s: 0.45, c: 0x4ade80, spin: 0.28 },
    { kind: "pip", x: 0.2, y: 0.4, z: -3.5, s: 0.3, c: 0xffffff, spin: 0.1 },
  ],
  "2hh": [
    { kind: "card", x: -2.6, y: 1.2, z: -2, s: 1.0, c: 0xe8e6e3, spin: 0.2 },
    { kind: "card", x: 2.6, y: -1.2, z: -2, s: 0.95, c: 0xfb7185, spin: 0.18 },
    { kind: "chip", x: 1.4, y: 1.4, z: -2.8, s: 0.45, c: 0x38bdf8, spin: 0.28 },
    { kind: "pip", x: -2.0, y: -1.6, z: -3, s: 0.28, c: 0xfb7185, spin: 0.12 },
  ],
  badugi: [
    { kind: "card", x: -2.6, y: 1.2, z: -2, s: 1.0, c: 0xe0f2fe, spin: 0.16 },
    { kind: "card", x: 2.6, y: -1.2, z: -2, s: 0.9, c: 0x94a3b8, spin: 0.14 },
    { kind: "chip", x: 1.2, y: 1.4, z: -3, s: 0.4, c: 0xe0f2fe, spin: 0.24 },
    { kind: "pip", x: -1.8, y: -1.5, z: -3.2, s: 0.28, c: 0x94a3b8, spin: 0.12 },
  ],
  book: [
    { kind: "book", x: -2.6, y: 1.2, z: -2, s: 1.0, c: 0xd4af37, spin: 0.1 },
    { kind: "cross", x: 2.6, y: -1.2, z: -2, s: 0.8, c: 0xa78bfa, spin: 0.12 },
    { kind: "chip", x: 1.4, y: 1.4, z: -2.8, s: 0.45, c: 0xfcd34d, spin: 0.22 },
    { kind: "book", x: -1.8, y: -1.5, z: -3, s: 0.45, c: 0xc48b3b, spin: 0.08 },
    { kind: "spark", x: 0.2, y: 0.2, z: -4, s: 0.1, c: 0xfde68a, spin: 0 },
  ],
  contact: [
    { kind: "banner", x: -2.6, y: 1.2, z: -2, s: 0.9, c: 0x8b5cf6, spin: 0.1 },
    { kind: "banner", x: 2.6, y: -1.2, z: -2, s: 0.8, c: 0xd4af37, spin: 0.12 },
    { kind: "spark", x: 0, y: 0.3, z: -4, s: 0.12, c: 0xffffff, spin: 0 },
    { kind: "spark", x: 1.6, y: 1.0, z: -4.2, s: 0.1, c: 0xffffff, spin: 0 },
    { kind: "spark", x: -1.8, y: -1.4, z: -4.5, s: 0.08, c: 0xffffff, spin: 0 },
  ],
};

function makeMesh(kind, color, scale) {
  let geo;
  switch (kind) {
    case "cruiser":
      geo = new THREE.BoxGeometry(1.6 * scale, 0.28 * scale, 0.45 * scale);
      break;
    case "tank":
      geo = new THREE.BoxGeometry(1.1 * scale, 0.35 * scale, 0.7 * scale);
      break;
    case "ring":
      geo = new THREE.TorusGeometry(0.55 * scale, 0.08 * scale, 10, 32);
      break;
    case "crystal":
      geo = new THREE.OctahedronGeometry(0.55 * scale, 0);
      break;
    case "tetra":
      geo = new THREE.TetrahedronGeometry(0.6 * scale, 0);
      break;
    case "spark":
      geo = new THREE.SphereGeometry(0.5 * scale, 8, 8);
      break;
    case "star":
      geo = new THREE.IcosahedronGeometry(0.55 * scale, 0);
      break;
    case "blob":
      geo = new THREE.DodecahedronGeometry(0.5 * scale, 0);
      break;
    case "cross": {
      const g = new THREE.Group();
      const mat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      });
      const a = new THREE.Mesh(new THREE.BoxGeometry(1.1 * scale, 0.18 * scale, 0.18 * scale), mat);
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.18 * scale, 1.1 * scale, 0.18 * scale), mat.clone());
      g.add(a, b);
      return g;
    }
    case "shield":
      geo = new THREE.CylinderGeometry(0.55 * scale, 0.7 * scale, 0.12 * scale, 6);
      break;
    case "banner":
      geo = new THREE.BoxGeometry(0.7 * scale, 1.0 * scale, 0.08 * scale);
      break;
    case "card":
      geo = new THREE.BoxGeometry(0.7 * scale, 1.0 * scale, 0.04 * scale);
      break;
    case "pip":
      geo = new THREE.SphereGeometry(0.35 * scale, 12, 12);
      break;
    case "chip":
      geo = new THREE.CylinderGeometry(0.45 * scale, 0.45 * scale, 0.1 * scale, 24);
      break;
    case "book":
      geo = new THREE.BoxGeometry(0.9 * scale, 1.15 * scale, 0.22 * scale);
      break;
    default:
      geo = new THREE.BoxGeometry(0.5 * scale, 0.5 * scale, 0.5 * scale);
  }
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: kind === "spark" ? 0.7 : 0.42,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  if (kind === "chip") mesh.rotation.x = Math.PI / 2;
  return mesh;
}

function createFogShader() {
  const maxHoles = 48;
  const holeData = new Float32Array(maxHoles * 3); // x, y, r (ndc-ish 0..1)
  return {
    maxHoles,
    holeData,
    holeCount: 0,
    material: new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uOpacity: { value: coarse ? 0.35 : 0.55 },
        uHoleCount: { value: 0 },
        uHoles: { value: holeData },
        uAspect: { value: 1 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
      fragmentShader: `
        precision mediump float;
        varying vec2 vUv;
        uniform float uOpacity;
        uniform int uHoleCount;
        uniform float uHoles[${maxHoles * 3}];
        uniform float uAspect;
        void main() {
          float cover = uOpacity;
          for (int i = 0; i < ${maxHoles}; i++) {
            if (i >= uHoleCount) break;
            vec2 h = vec2(uHoles[i * 3], uHoles[i * 3 + 1]);
            float r = uHoles[i * 3 + 2];
            vec2 d = vUv - h;
            d.x *= uAspect;
            float dist = length(d);
            float hole = smoothstep(r, r * 0.15, dist);
            cover *= (1.0 - hole * 0.95);
          }
          gl_FragColor = vec4(0.02, 0.02, 0.04, cover);
        }
      `,
    }),
  };
}

export function initBgScene(canvas) {
  if (!canvas || reduced) {
    if (canvas) canvas.style.display = "none";
    return null;
  }

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: !coarse,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.25 : 1.75));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 40);
  camera.position.set(0, 0, 6);

  const root = new THREE.Group();
  scene.add(root);

  const themeGroups = new Map();
  Object.keys(FLEETS).forEach((key) => {
    const group = new THREE.Group();
    group.visible = false;
    group.userData.assets = [];
    FLEETS[key].forEach((spec, idx) => {
      const mesh = makeMesh(spec.kind, spec.c, spec.s);
      mesh.position.set(spec.x, spec.y, spec.z);
      mesh.userData = {
        base: mesh.position.clone(),
        spin: spec.spin,
        phase: idx * 1.7,
        dir: idx % 2 === 0 ? 1 : -1,
        kind: spec.kind,
      };
      group.add(mesh);
      group.userData.assets.push(mesh);
    });
    root.add(group);
    themeGroups.set(key, group);
  });

  /* Fog plane in front of fleets (screen-space) */
  const fog = createFogShader();
  const fogMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), fog.material);
  fogMesh.frustumCulled = false;
  fogMesh.renderOrder = 10;
  scene.add(fogMesh);

  /* Restore scout holes */
  const holeKey = "d22-fog-holes";
  try {
    const saved = JSON.parse(sessionStorage.getItem(holeKey) || "[]");
    saved.forEach((h) => {
      if (fog.holeCount >= fog.maxHoles) return;
      const i = fog.holeCount * 3;
      fog.holeData[i] = h.x;
      fog.holeData[i + 1] = 1 - h.y;
      fog.holeData[i + 2] = h.r;
      fog.holeCount++;
    });
    fog.material.uniforms.uHoleCount.value = fog.holeCount;
  } catch (_) {}

  if (!fog.holeCount && !reduced) {
    const seed = [
      { x: 0.5, y: 0.35, r: 0.55 },
      { x: 0.5, y: 0.7, r: 0.4 },
    ];
    seed.forEach((h) => {
      const i = fog.holeCount * 3;
      fog.holeData[i] = h.x;
      fog.holeData[i + 1] = 1 - h.y;
      fog.holeData[i + 2] = h.r;
      fog.holeCount++;
    });
    fog.material.uniforms.uHoleCount.value = fog.holeCount;
  }

  if (reduced) {
    fogMesh.visible = false;
  }

  function resolveFleetKey(key) {
    const raw = key || "starcraft";
    if (raw === "hero") return themeGroups.has("starcraft") ? "starcraft" : "starcraft";
    if (themeGroups.has(raw)) return raw;
    const base = raw.replace(/-v[23]$/, "");
    return themeGroups.has(base) ? base : "starcraft";
  }

  let activeKey = resolveFleetKey(document.body.dataset.bg);
  function setTheme(key) {
    const next = resolveFleetKey(key);
    if (next === activeKey && themeGroups.get(next)?.visible) return;
    const prev = themeGroups.get(activeKey);
    const cur = themeGroups.get(next);
    activeKey = next;
    if (reduced) {
      themeGroups.forEach((g, k) => {
        g.visible = k === next;
        g.traverse((o) => {
          if (o.material && o.material.opacity != null && o.userData?.kind !== "spark") {
            /* leave */
          }
        });
      });
      if (cur) cur.visible = true;
      return;
    }
    themeGroups.forEach((g, k) => {
      if (k === next) {
        g.visible = true;
        g.traverse((obj) => {
          if (obj.isMesh && obj.material && "opacity" in obj.material) {
            const target = obj.userData?.kind === "spark" ? 0.7 : 0.42;
            gsap.fromTo(
              obj.material,
              { opacity: 0 },
              { opacity: target, duration: 1.45, ease: "power1.inOut", overwrite: "auto" }
            );
          }
        });
      } else if (g.visible) {
        const mats = [];
        g.traverse((obj) => {
          if (obj.isMesh && obj.material && "opacity" in obj.material) mats.push(obj.material);
        });
        if (!mats.length) {
          g.visible = false;
          return;
        }
        gsap.to(mats, {
          opacity: 0,
          duration: 1.25,
          ease: "power1.inOut",
          overwrite: "auto",
          onComplete: () => {
            if (activeKey !== k) g.visible = false;
          },
        });
      }
    });
    if (cur) cur.visible = true;
  }

  setTheme(activeKey);

  let w = 0;
  let h = 0;
  function resize() {
    const vv = window.visualViewport;
    w = Math.round((vv && vv.width) || window.innerWidth);
    h = Math.round((vv && vv.height) || window.innerHeight);
    renderer.setSize(w, h, false);
    const aspect = w / Math.max(1, h);
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    fog.material.uniforms.uAspect.value = aspect;
    /* Compress fleet X on portrait so side icons stay inside the narrower hFOV */
    root.scale.x = aspect < 1.2 ? Math.max(0.45, aspect / 1.2) : 1;
  }
  resize();

  /* Pointer scout */
  let lastScout = 0;
  function scout(clientX, clientY, radiusPx) {
    if (reduced || !w || !h) return;
    const x = clientX / w;
    const y = clientY / h;
    const r = (radiusPx || 90) / Math.min(w, h);
    if (fog.holeCount >= fog.maxHoles) {
      fog.holeData.copyWithin(0, 3);
      fog.holeCount = fog.maxHoles - 1;
    }
    const i = fog.holeCount * 3;
    fog.holeData[i] = x;
    fog.holeData[i + 1] = 1 - y;
    fog.holeData[i + 2] = r;
    fog.holeCount++;
    fog.material.uniforms.uHoleCount.value = fog.holeCount;
    try {
      const packed = [];
      for (let n = 0; n < fog.holeCount; n++) {
        packed.push({
          x: fog.holeData[n * 3],
          y: 1 - fog.holeData[n * 3 + 1],
          r: fog.holeData[n * 3 + 2],
        });
      }
      sessionStorage.setItem(holeKey, JSON.stringify(packed.slice(-40)));
    } catch (_) {}
  }

  function onPointer(e) {
    const now = performance.now();
    const throttle = coarse ? 48 : 16;
    if (now - lastScout < throttle) return;
    lastScout = now;
    if (!coarse && Math.random() > 0.55) return;
    const radius = coarse ? 100 + Math.random() * 40 : 70 + Math.random() * 40;
    scout(e.clientX, e.clientY, radius);
  }

  if (!reduced) {
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("pointerdown", onPointer, { passive: true });
  }

  /* Scroll / pointer parallax — lerped so fleets ease instead of snapping */
  const parallax = { scroll: 0, scrollTarget: 0 };
  let pointerX = 0;
  let pointerY = 0;
  let smoothPX = 0;
  let smoothPY = 0;
  const PARALLAX_LERP = coarse ? 0.045 : 0.035;
  const POINTER_LERP = coarse ? 0.055 : 0.04;

  function syncScrollParallax() {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    parallax.scrollTarget = window.scrollY / max;
  }

  if (!reduced) {
    window.addEventListener(
      "pointermove",
      (e) => {
        pointerX = (e.clientX / Math.max(1, w) - 0.5) * 2;
        pointerY = (e.clientY / Math.max(1, h) - 0.5) * 2;
      },
      { passive: true }
    );
    window.addEventListener("scroll", syncScrollParallax, { passive: true });
    syncScrollParallax();
  }

  /* Theme opacity for fog by bg */
  function syncFogOpacity() {
    const bg = resolveFleetKey(document.body.dataset.bg);
    const base = bg.replace(/-v[23]$/, "");
    let op = coarse ? 0.28 : 0.42;
    if (["poker", "2hh", "badugi", "hearthstone", "cnc", "warcraft", "mtg"].includes(base)) {
      op = 0.1;
    } else if (base === "about" || base === "contact") {
      op = 0.2;
    } else if (base === "starcraft" || base === "hero") {
      op = coarse ? 0.3 : 0.48;
    }
    gsap.to(fog.material.uniforms.uOpacity, {
      value: reduced ? 0 : op,
      duration: 1.4,
      ease: "power1.inOut",
      overwrite: "auto",
    });
  }
  syncFogOpacity();

  new MutationObserver(() => {
    setTheme(document.body.dataset.bg || "starcraft");
    syncFogOpacity();
  }).observe(document.body, { attributes: true, attributeFilter: ["data-bg"] });

  let running = true;
  let raf = 0;
  const clock = new THREE.Clock();

  function frame() {
    if (!running) return;
    const t = clock.getElapsedTime();
    const group = themeGroups.get(activeKey);
    if (group && !reduced) {
      parallax.scroll += (parallax.scrollTarget - parallax.scroll) * PARALLAX_LERP;
      smoothPX += (pointerX - smoothPX) * POINTER_LERP;
      smoothPY += (pointerY - smoothPY) * POINTER_LERP;
      const enter = 1;
      const scrollPull = (parallax.scroll - 0.5) * 0.7;
      group.userData.assets.forEach((mesh) => {
        const u = mesh.userData;
        const depth = 0.4 + Math.abs(u.base.z) * 0.08;
        const dx = Math.sin(t * 0.22 + u.phase) * 0.1 * depth + smoothPX * 0.1 * depth;
        const dy =
          Math.cos(t * 0.18 + u.phase * 1.3) * 0.08 * depth -
          smoothPY * 0.08 * depth -
          scrollPull * 0.28 * depth;
        mesh.position.x = u.base.x + dx;
        mesh.position.y = u.base.y + dy;
        mesh.position.z = u.base.z + (enter - 1) * 0.5;
        if (u.spin) {
          if (u.kind === "card") mesh.rotation.y = t * u.spin * 0.65 * u.dir;
          else mesh.rotation.z = t * u.spin * 0.65 * u.dir;
        }
      });
      root.rotation.y = smoothPX * 0.028;
      root.rotation.x = -smoothPY * 0.02;
    }
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }

  function syncShortLandscape() {
    const short = shortLandscapeMq?.matches;
    if (short) {
      canvas.style.display = "none";
      running = false;
      cancelAnimationFrame(raf);
      return;
    }
    canvas.style.display = "block";
    if (!running && !document.hidden) {
      running = true;
      clock.start();
      raf = requestAnimationFrame(frame);
    }
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden || shortLandscapeMq?.matches) {
      running = false;
      cancelAnimationFrame(raf);
    } else {
      running = true;
      clock.start();
      raf = requestAnimationFrame(frame);
    }
  });

  window.addEventListener("resize", () => {
    resize();
    syncShortLandscape();
    syncScrollParallax();
  });
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", resize);
  }
  if (shortLandscapeMq) {
    if (typeof shortLandscapeMq.addEventListener === "function") {
      shortLandscapeMq.addEventListener("change", syncShortLandscape);
    } else if (typeof shortLandscapeMq.addListener === "function") {
      shortLandscapeMq.addListener(syncShortLandscape);
    }
  }

  syncShortLandscape();
  if (running) raf = requestAnimationFrame(frame);

  return {
    setTheme,
    scout,
    resize,
    dispose() {
      running = false;
      cancelAnimationFrame(raf);
      renderer.dispose();
    },
  };
}
