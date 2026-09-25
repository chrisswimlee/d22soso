/* Shared WebGL background: constellation sky + themed fleets + fog scout */
import * as THREE from "three";
import gsap from "gsap";
import { isInteractive, atmosphereBlocked, drawingDpr } from "./pref.js";
import {
  pickStarColor,
  sampleIcons,
  sampleHeroParts,
  SKY_PARTS,
  SKY_PART_WEIGHTS,
} from "./sky-sample.js";

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
      geo = new THREE.TorusGeometry(0.55 * scale, 0.08 * scale, 8, 16);
      break;
    case "crystal":
      geo = new THREE.OctahedronGeometry(0.55 * scale, 0);
      break;
    case "tetra":
      geo = new THREE.TetrahedronGeometry(0.6 * scale, 0);
      break;
    case "spark":
      geo = new THREE.SphereGeometry(0.5 * scale, 6, 6);
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
      geo = new THREE.SphereGeometry(0.35 * scale, 8, 8);
      break;
    case "chip":
      geo = new THREE.CylinderGeometry(0.45 * scale, 0.45 * scale, 0.1 * scale, 12);
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
  const maxHoles = coarse ? 16 : 24;
  const holeData = new Float32Array(maxHoles * 3);
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

function makeNebulaSprite(hex, x, y, sx, sy) {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const g = c.getContext("2d");
  const r = (hex >> 16) & 255;
  const gv = (hex >> 8) & 255;
  const b = hex & 255;
  const grd = g.createRadialGradient(128, 128, 8, 128, 128, 124);
  grd.addColorStop(0, `rgba(${r},${gv},${b},0.55)`);
  grd.addColorStop(0.42, `rgba(${r},${gv},${b},0.14)`);
  grd.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    opacity: 0,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.position.set(x, y, -9);
  sprite.scale.set(sx, sy, 1);
  sprite.renderOrder = -1;
  return { sprite, mat, tex };
}

function makeStarSprite() {
  const s = 64;
  const c = document.createElement("canvas");
  c.width = s;
  c.height = s;
  const g = c.getContext("2d");
  const grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.22, "rgba(255,255,255,0.72)");
  grd.addColorStop(0.55, "rgba(255,255,255,0.18)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, s, s);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function initBgScene(canvas) {
  if (!canvas || reduced) {
    if (canvas) canvas.style.display = "none";
    return null;
  }
  document.documentElement.classList.add("has-webgl-sky");

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: !coarse,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(drawingDpr());
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 40);
  camera.position.set(0, 0, 6);

  const root = new THREE.Group();
  scene.add(root);

  const themeGroups = new Map();
  let fleetsHeld = document.documentElement.classList.contains("is-intro-pending");

  function resolveFleetKey(key) {
    const raw = key || "starcraft";
    if (raw === "hero") return "starcraft";
    if (FLEETS[raw]) return raw;
    const base = raw.replace(/-v[23]$/, "");
    return FLEETS[base] ? base : "starcraft";
  }

  function ensureFleet(key) {
    const next = resolveFleetKey(key);
    let group = themeGroups.get(next);
    if (group) return group;
    group = new THREE.Group();
    group.visible = false;
    group.userData.assets = [];
    (FLEETS[next] || []).forEach((spec, idx) => {
      const mesh = makeMesh(spec.kind, spec.c, spec.s);
      mesh.position.set(spec.x, spec.y, spec.z);
      mesh.userData = {
        base: mesh.position.clone(),
        rest: mesh.position.clone(),
        orbit: null,
        vel: new THREE.Vector3(),
        dragging: false,
        hover: 0,
        spin: spec.spin,
        phase: idx * 1.7,
        dir: idx % 2 === 0 ? 1 : -1,
        kind: spec.kind,
      };
      group.add(mesh);
      group.userData.assets.push(mesh);
    });
    root.add(group);
    themeGroups.set(next, group);
    return group;
  }

  const PHOTO_COUNT = coarse ? 6500 : 16000;
  const STAR_COUNT = PHOTO_COUNT;
  const starBase = new Float32Array(STAR_COUNT * 3);
  const starPhase = new Float32Array(STAR_COUNT);
  const starPos = new Float32Array(STAR_COUNT * 3);
  const starVel = new Float32Array(STAR_COUNT * 2);
  const starClump = new Uint8Array(STAR_COUNT);
  const starSpinX = new Float32Array(STAR_COUNT);
  const starSpinY = new Float32Array(STAR_COUNT);
  const starIconX = new Float32Array(STAR_COUNT);
  const starIconY = new Float32Array(STAR_COUNT);
  const starLandX = new Float32Array(STAR_COUNT);
  const starLandY = new Float32Array(STAR_COUNT);
  const starPart = new Int8Array(STAR_COUNT);
  const starPhoto = new Uint8Array(STAR_COUNT);
  const starColor = new Float32Array(STAR_COUNT * 3);
  const starColorTarget = new Float32Array(STAR_COUNT * 3);
  let morphBoost = 0;
  let skyPhotoReady = false;
  const ripples = [];
  starIconX.fill(NaN);
  starIconY.fill(NaN);
  starLandX.fill(NaN);
  starLandY.fill(NaN);
  starPart.fill(-1);

  for (let i = 0; i < STAR_COUNT; i++) {
    starBase[i * 3] = (Math.random() - 0.5) * 18;
    starBase[i * 3 + 1] = (Math.random() - 0.5) * 12;
    starBase[i * 3 + 2] = -7 - Math.random() * 9;
    starPhase[i] = Math.random() * Math.PI * 2;
    const arm = (i / Math.max(1, STAR_COUNT - 1)) * Math.PI * 7.4 + starPhase[i];
    const rad = 0.35 + (i % 11) * 0.22 + Math.random() * 0.35;
    starSpinX[i] = Math.cos(arm) * rad * 3.4;
    starSpinY[i] = Math.sin(arm) * rad * 2.2;
    starPos[i * 3] = starSpinX[i];
    starPos[i * 3 + 1] = starSpinY[i];
    starPos[i * 3 + 2] = starBase[i * 3 + 2];
    const col = pickStarColor(i);
    starColor[i * 3] = col[0];
    starColor[i * 3 + 1] = col[1];
    starColor[i * 3 + 2] = col[2];
    starColorTarget[i * 3] = col[0];
    starColorTarget[i * 3 + 1] = col[1];
    starColorTarget[i * 3 + 2] = col[2];
  }

  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
  starGeo.setAttribute("color", new THREE.BufferAttribute(starColor, 3));
  const starMat = new THREE.PointsMaterial({
    size: coarse ? 7 : 9,
    sizeAttenuation: false,
    map: makeStarSprite(),
    transparent: true,
    opacity: 0,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
  });

  const stars = new THREE.Points(starGeo, starMat);
  stars.frustumCulled = false;
  stars.renderOrder = 0;
  scene.add(stars);

  const MAX_IDLE = coarse ? 22 : 72;
  const MAX_USER = 40;
  const MAX_LINES = MAX_IDLE + MAX_USER;
  const linePos = new Float32Array(MAX_LINES * 6);
  const lineCol = new Float32Array(MAX_LINES * 6);
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute("position", new THREE.BufferAttribute(linePos, 3));
  lineGeo.setAttribute("color", new THREE.BufferAttribute(lineCol, 3));
  lineGeo.setDrawRange(0, 0);
  const lineMat = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const constellations = new THREE.LineSegments(lineGeo, lineMat);
  constellations.frustumCulled = false;
  constellations.renderOrder = 1;
  scene.add(constellations);

  const idlePairs = [];
  const userBonds = [];
  let lastWeave = 0;
  let lastGrow = 0;

  const nebulae = coarse
    ? []
    : [
        makeNebulaSprite(0x8b5cf6, -3.4, 1.2, 16, 11),
        makeNebulaSprite(0xd4af37, 3.6, 0.4, 14, 10),
      ];
  nebulae.forEach((n) => scene.add(n.sprite));

  const liveGrid = new THREE.GridHelper(16, 14, 0xd4af37, 0xd4af37);
  liveGrid.rotation.x = Math.PI / 2;
  liveGrid.position.set(0, 0, -9);
  liveGrid.renderOrder = 0;
  const liveGridMats = Array.isArray(liveGrid.material) ? liveGrid.material : [liveGrid.material];
  liveGridMats.forEach((m) => {
    m.transparent = true;
    m.opacity = 0;
    m.depthWrite = false;
  });
  scene.add(liveGrid);

  function starOpacityForBg(key) {
    const raw = key || "";
    const base = raw.replace(/-v[23]$/, "");
    if (raw === "hero" || base === "hero") return skyPhotoReady ? 0.14 : coarse ? 0.82 : 0.96;
    if (base === "starcraft") return coarse ? 0.36 : 0.52;
    if (["cnc", "warcraft", "mtg", "hearthstone"].includes(base)) return 0.1;
    if (["poker", "2hh", "badugi"].includes(base)) return 0.14;
    return 0.012;
  }

  function gridOpacityForBg(key) {
    const raw = key || "";
    const base = raw.replace(/-v[23]$/, "");
    if (raw === "hero" || base === "hero") return skyPhotoReady ? 0 : 0.06;
    if (base === "starcraft") return 0.06;
    return 0;
  }

  function lineOpacityForBg(key) {
    const raw = key || "";
    const base = raw.replace(/-v[23]$/, "");
    if (raw === "hero" || base === "hero") return skyPhotoReady ? 0.04 : coarse ? 0.12 : 0.16;
    if (base === "starcraft") return coarse ? 0.16 : 0.28;
    if (["poker", "2hh", "badugi"].includes(base)) return 0.08;
    return 0.02;
  }

  let heroLeave = 0;
  const boot = {
    playing: false,
    phase: "landed",
    icon: 0,
    land: 0,
    release: 1,
    partT: { card: 0, lockup: 0, rest: 0 },
    tl: null,
    revealed: false,
    firedParts: new Set(),
    onReveal: null,
    onRevealPart: null,
    onDone: null,
  };

  function themeFloor() {
    return starOpacityForBg(document.body.dataset.bg);
  }

  function desiredStarOpacity() {
    if (boot.playing) return coarse ? 0.82 : 0.98;
    const floor = themeFloor();
    const bg = document.body.dataset.bg || "";
    if (bg === "hero" || bg === "") {
      return floor * (1 - heroLeave * 0.82) + 0.04 * heroLeave;
    }
    return floor;
  }

  function desiredLineOpacity() {
    if (boot.playing) return coarse ? 0.22 : 0.28;
    const floor = lineOpacityForBg(document.body.dataset.bg);
    const bg = document.body.dataset.bg || "";
    if (bg === "hero") return floor * (1 - heroLeave * 0.88);
    return floor;
  }

  function syncStarOpacity() {
    const next = reduced ? 0 : desiredStarOpacity();
    gsap.to(starMat, {
      opacity: next,
      duration: boot.playing ? 0.55 : 1.6,
      ease: "power1.inOut",
      overwrite: "auto",
    });
    gsap.to(lineMat, {
      opacity: reduced ? 0 : desiredLineOpacity(),
      duration: boot.playing ? 0.55 : 1.6,
      ease: "power1.inOut",
      overwrite: "auto",
    });
    const nebulaOp =
      reduced || coarse ? 0 : desiredStarOpacity() * (boot.playing ? 0.34 : 0.22) * (1 - heroLeave * 0.7);
    nebulae.forEach((n) => {
      gsap.to(n.mat, {
        opacity: nebulaOp,
        duration: 1.1,
        ease: "power1.inOut",
        overwrite: "auto",
      });
    });
    const gridOp = reduced || boot.playing ? 0 : gridOpacityForBg(document.body.dataset.bg) * (1 - heroLeave);
    liveGridMats.forEach((m) => {
      gsap.to(m, {
        opacity: gridOp,
        duration: 1.15,
        ease: "power1.inOut",
        overwrite: "auto",
      });
    });
  }

  const fog = createFogShader();
  const fogMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), fog.material);
  fogMesh.frustumCulled = false;
  fogMesh.renderOrder = 10;
  scene.add(fogMesh);

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

  let activeKey = resolveFleetKey(document.body.dataset.bg);
  function setTheme(key) {
    const next = resolveFleetKey(key);
    const cur = ensureFleet(next);
    if (next === activeKey && cur.visible && !fleetsHeld) return;
    activeKey = next;
    if (fleetsHeld) {
      themeGroups.forEach((g) => {
        g.visible = false;
      });
      return;
    }
    if (reduced) {
      themeGroups.forEach((g, k) => {
        g.visible = k === next;
      });
      cur.visible = true;
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
              { opacity: target, duration: 0.72, ease: "power2.out", overwrite: "auto" }
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
          duration: 0.58,
          ease: "power2.in",
          overwrite: "auto",
          onComplete: () => {
            if (activeKey !== k) g.visible = false;
          },
        });
      }
    });
    if (cur) cur.visible = true;
  }

  let previewKey = null;
  let previewBoost = 0;

  function previewFleet(key) {
    if (reduced || fleetsHeld || boot.playing) return;
    if (document.body.dataset.bg !== "hero") return;
    previewKey = key || null;
    if (key) setTheme(key);
    bumpActivity();
  }

  setTheme(activeKey);

  let w = 0;
  let h = 0;
  function resize() {
    const vv = window.visualViewport;
    w = Math.round((vv && vv.width) || window.innerWidth);
    h = Math.round((vv && vv.height) || window.innerHeight);
    renderer.setPixelRatio(drawingDpr());
    renderer.setSize(w, h, false);
    const aspect = w / Math.max(1, h);
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    fog.material.uniforms.uAspect.value = aspect;
    root.scale.x = aspect < 1.2 ? Math.max(0.45, aspect / 1.2) : 1;
  }
  resize();

  let lastScout = 0;
  let persistTimer = 0;
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
    if (persistTimer) return;
    persistTimer = setTimeout(() => {
      persistTimer = 0;
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
    }, 450);
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

  let holding = false;
  let holdTimer = 0;
  let holdSX = 0;
  let holdSY = 0;
  let holdCX = 0;
  let holdCY = 0;
  let burstX = 0;
  let burstY = 0;
  let burstPow = 0;
  let clump = [];
  let dragMesh = null;
  let hoverMesh = null;
  const raycaster = new THREE.Raycaster();
  const pointerNdc = new THREE.Vector2();
  const dragPlane = new THREE.Plane();
  const planeHit = new THREE.Vector3();
  const grabOffset = new THREE.Vector3();
  const lastRest = new THREE.Vector3();

  function clientToWorld(cx, cy) {
    const ndcX = (cx / Math.max(1, w) - 0.5) * 2;
    const ndcY = -(cy / Math.max(1, h) - 0.5) * 2;
    const dist = 14;
    const halfH = Math.tan((42 * Math.PI) / 360) * dist;
    const halfW = halfH * (w / Math.max(1, h));
    return { x: ndcX * halfW, y: ndcY * halfH };
  }

  function lockHeroPhoto() {
    markSkyPhoto(true);
    syncStarOpacity();
  }

  function impulseAt(cx, cy, power) {
    const p = clientToWorld(cx, cy);
    burstX = p.x;
    burstY = p.y;
    burstPow = power;
  }

  function addRipple(cx, cy) {
    const p = clientToWorld(cx, cy);
    ripples.push({
      x: p.x,
      y: p.y,
      r: 0.04,
      life: 1,
      speed: coarse ? 1.35 : 1.7,
    });
    bumpActivity();
  }

  function setPointerNdc(e) {
    pointerNdc.x = (e.clientX / Math.max(1, w) - 0.5) * 2;
    pointerNdc.y = -(e.clientY / Math.max(1, h) - 0.5) * 2;
  }

  function activeAssets() {
    return themeGroups.get(activeKey)?.userData.assets || [];
  }

  function resolveAsset(obj, assets) {
    let cur = obj;
    while (cur) {
      if (assets.includes(cur)) return cur;
      cur = cur.parent;
    }
    return null;
  }

  function hitFleet(e) {
    const assets = activeAssets();
    if (!assets.length) return null;
    setPointerNdc(e);
    raycaster.setFromCamera(pointerNdc, camera);
    const hits = raycaster.intersectObjects(assets, true);
    if (!hits.length) return null;
    return resolveAsset(hits[0].object, assets);
  }

  function intersectDragPlane(e) {
    setPointerNdc(e);
    raycaster.setFromCamera(pointerNdc, camera);
    return raycaster.ray.intersectPlane(dragPlane, planeHit) ? planeHit : null;
  }

  function clampRest(v) {
    v.x = Math.max(-4.8, Math.min(4.8, v.x));
    v.y = Math.max(-2.8, Math.min(2.8, v.y));
  }

  function pickClump(wx, wy) {
    clump.length = 0;
    starClump.fill(0);
    const r2 = 0.72;
    for (let i = 0; i < STAR_COUNT; i++) {
      const dx = starPos[i * 3] - wx;
      const dy = starPos[i * 3 + 1] - wy;
      if (dx * dx + dy * dy < r2) {
        clump.push(i);
        starClump[i] = 1;
      }
    }
  }

  function setFleetCursor(hover, dragging) {
    document.body.classList.toggle("is-hover-fleet", !!hover && !dragging);
    document.body.classList.toggle("is-dragging-fleet", !!dragging);
  }

  function clearHoldTimer() {
    if (holdTimer) {
      window.clearTimeout(holdTimer);
      holdTimer = 0;
    }
  }

  function starsLive() {
    return starOpacityForBg(document.body.dataset.bg) > 0.05;
  }

  function armHold(e) {
    if (coarse || fleetsHeld || boot.playing || !starsLive()) return;
    holdSX = holdCX = e.clientX;
    holdSY = holdCY = e.clientY;
    holdTimer = window.setTimeout(() => {
      holdTimer = 0;
      if (atmosphereBlocked() || fleetsHeld || boot.playing || !starsLive()) return;
      const p = clientToWorld(holdCX, holdCY);
      holding = true;
      pickClump(p.x, p.y);
      addRipple(holdCX, holdCY);
      bumpActivity();
    }, 300);
  }

  function endDrag() {
    clearHoldTimer();
    if (dragMesh) {
      const u = dragMesh.userData;
      u.dragging = false;
      u.vel.x *= 0.92;
      u.vel.y *= 0.92;
      dragMesh = null;
    }
    holding = false;
    clump.length = 0;
    starClump.fill(0);
    setFleetCursor(false, false);
  }

  function emptySpace(e) {
    if (atmosphereBlocked()) return false;
    if (e.button != null && e.button !== 0) return false;
    if (isInteractive(e.target)) return false;
    return true;
  }

  if (!reduced) {
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener(
      "pointerdown",
      (e) => {
        if (!emptySpace(e)) return;
        const hit = coarse ? null : hitFleet(e);
        if (hit) {
          dragMesh = hit;
          const u = hit.userData;
          u.dragging = true;
          u.vel.set(0, 0, 0);
          dragPlane.setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 0, 1), u.rest);
          const p = intersectDragPlane(e);
          if (p) grabOffset.copy(u.rest).sub(p);
          else grabOffset.set(0, 0, 0);
          lastRest.copy(u.rest);
          setFleetCursor(false, true);
        } else {
          armHold(e);
        }
        onPointer(e);
        bumpActivity();
      },
      { passive: true }
    );
    window.addEventListener(
      "pointermove",
      (e) => {
        if (holdTimer) {
          holdCX = e.clientX;
          holdCY = e.clientY;
          const dx = holdCX - holdSX;
          const dy = holdCY - holdSY;
          if (dx * dx + dy * dy > 196) clearHoldTimer();
        }
        if (dragMesh) {
          const p = intersectDragPlane(e);
          if (p) {
            const u = dragMesh.userData;
            u.rest.copy(p).add(grabOffset);
            clampRest(u.rest);
            u.vel.copy(u.rest).sub(lastRest);
            lastRest.copy(u.rest);
          }
          bumpActivity();
          return;
        }
        if (coarse || atmosphereBlocked() || isInteractive(e.target)) {
          if (hoverMesh) {
            hoverMesh = null;
            setFleetCursor(false, false);
          }
          return;
        }
        const next = hitFleet(e);
        hoverMesh = next;
        setFleetCursor(!!next, false);
      },
      { passive: true }
    );
    window.addEventListener("pointerup", endDrag, { passive: true });
    window.addEventListener("pointercancel", endDrag, { passive: true });
  }

  const parallax = { scroll: 0, scrollTarget: 0 };
  let pointerX = 0;
  let pointerY = 0;
  let smoothPX = 0;
  let smoothPY = 0;
  const PARALLAX_LERP = coarse ? 0.045 : 0.035;
  const POINTER_LERP = coarse ? 0.05 : 0.038;

  let heroLeaveTarget = 0;

  function syncScrollParallax() {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    parallax.scrollTarget = window.scrollY / max;
    heroLeaveTarget = Math.min(1, Math.max(0, (window.scrollY - h * 0.06) / Math.max(1, h * 0.7)));
    if (reduced) {
      heroLeave = heroLeaveTarget;
      document.documentElement.style.setProperty("--hero-leave", heroLeave.toFixed(3));
    }
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

  function syncFogOpacity() {
    const bg = resolveFleetKey(document.body.dataset.bg);
    const base = bg.replace(/-v[23]$/, "");
    let op = coarse ? 0.28 : 0.42;
    if (boot.playing) op = coarse ? 0.08 : 0.12;
    else if (["poker", "2hh", "badugi", "hearthstone", "cnc", "warcraft", "mtg"].includes(base)) {
      op = 0.1;
    } else if (base === "about" || base === "contact") {
      op = 0.2;
    } else if (document.body.dataset.bg === "hero") {
      op = (coarse ? 0.08 : 0.12) * (1 - heroLeave * 0.55);
    } else if (base === "starcraft") {
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
  syncStarOpacity();

  new MutationObserver(() => {
    setTheme(document.body.dataset.bg || "starcraft");
    syncFogOpacity();
    syncStarOpacity();
    if (dragMesh) endDrag();
    bumpActivity();
  }).observe(document.body, { attributes: true, attributeFilter: ["data-bg"] });

  let running = true;
  let raf = 0;
  let lastActivity = performance.now();
  const KEEP_FLOATING = !coarse;
  const IDLE_MS = KEEP_FLOATING ? 1e9 : 10000;
  const clock = new THREE.Clock();

  function bumpActivity() {
    lastActivity = performance.now();
    if (!running && !document.hidden && !shortLandscapeMq?.matches) {
      running = true;
      clock.start();
      raf = requestAnimationFrame(frame);
    }
  }

  if (!reduced) {
    window.addEventListener("pointermove", bumpActivity, { passive: true });
    window.addEventListener("pointerdown", bumpActivity, { passive: true });
    window.addEventListener("scroll", bumpActivity, { passive: true });
  }

  function assignIconTargets() {
    starIconX.fill(NaN);
    starIconY.fill(NaN);
    const icons = sampleIcons(coarse ? 28 : 48, coarse ? 4 : 3);
    let cursor = 0;
    icons.forEach((icon) => {
      icon.pts.forEach((p) => {
        if (cursor >= STAR_COUNT) return;
        starIconX[cursor] = icon.cx + (p.nx - 0.5) * icon.scale;
        starIconY[cursor] = icon.cy - (p.ny - 0.5) * icon.scale;
        cursor++;
      });
    });
  }

  function markSkyPhoto(on) {
    skyPhotoReady = !!on;
    document.documentElement.classList.toggle("has-sky-photo", skyPhotoReady);
  }

  function setHeroScene() {
    if (boot.playing) return;
    lockHeroPhoto();
    bumpActivity();
  }

  function assignLandTargets() {
    starLandX.fill(NaN);
    starLandY.fill(NaN);
    starPart.fill(-1);
    starPhoto.fill(0);
    const parts = sampleHeroParts(clientToWorld, { coarse });
    const usable = parts.filter((p) => p.pts.length);
    let cursor = 0;
    if (!usable.length) {
      for (let i = 0; i < STAR_COUNT; i++) {
        starLandX[i] = starBase[i * 3] * 0.35;
        starLandY[i] = starBase[i * 3 + 1] * 0.35;
      }
      return;
    }
    usable.forEach((part) => {
      const idx = SKY_PARTS.indexOf(part.id);
      const share = Math.max(6, Math.floor((STAR_COUNT - cursor) * (SKY_PART_WEIGHTS[part.id] || 0.15)));
      for (let k = 0; k < share && cursor < STAR_COUNT; k++, cursor++) {
        const p = part.pts[k % part.pts.length];
        starPart[cursor] = idx;
        starLandX[cursor] = p.x;
        starLandY[cursor] = p.y;
      }
    });
  }

  function snapField() {
    for (let i = 0; i < STAR_COUNT; i++) {
      starPos[i * 3] = starBase[i * 3];
      starPos[i * 3 + 1] = starBase[i * 3 + 1];
      starVel[i * 2] = 0;
      starVel[i * 2 + 1] = 0;
    }
    starGeo.attributes.position.needsUpdate = true;
  }

  function firePart(id) {
    if (boot.firedParts.has(id)) return;
    boot.firedParts.add(id);
    try {
      boot.onRevealPart?.(id);
    } catch {
      /* ignore */
    }
  }

  function fireReveal() {
    SKY_PARTS.forEach(firePart);
    if (boot.revealed) return;
    boot.revealed = true;
    try {
      boot.onReveal?.();
    } catch {
      /* ignore */
    }
  }

  function holdFleets() {
    fleetsHeld = true;
    themeGroups.forEach((g) => {
      g.visible = false;
    });
  }

  function releaseFleets() {
    fleetsHeld = false;
    setTheme(document.body.dataset.bg || "starcraft");
  }

  function stopBootTimeline() {
    if (boot.tl) {
      boot.tl.kill();
      boot.tl = null;
    }
  }

  function playSkyIntro({ onReveal, onRevealPart, onDone } = {}) {
    stopBootTimeline();
    boot.playing = false;
    boot.phase = "landed";
    boot.icon = 1;
    boot.land = 1;
    boot.release = 1;
    boot.partT = { card: 1, lockup: 1, rest: 1 };
    boot.revealed = false;
    boot.firedParts = new Set();
    boot.onReveal = onReveal;
    boot.onRevealPart = onRevealPart;
    boot.onDone = onDone;
    holdFleets();
    snapField();
    syncStarOpacity();
    syncFogOpacity();
    bumpActivity();

    const tl = gsap.timeline({
      onComplete: () => {
        boot.playing = false;
        boot.phase = "landed";
        releaseFleets();
        lockHeroPhoto();
        syncStarOpacity();
        syncFogOpacity();
        try {
          boot.onDone?.();
        } catch {
          /* ignore */
        }
      },
    });
    boot.tl = tl;
    /* Fade the hero in. The photograph stays still; stars do not assemble it. */
    tl.add(() => {
      SKY_PARTS.forEach(firePart);
      fireReveal();
    }, 0.12);
    tl.to({}, { duration: 0.8 }, 0);
  }

  function skipSkyIntro() {
    stopBootTimeline();
    boot.playing = false;
    boot.phase = "landed";
    boot.icon = 1;
    boot.land = 1;
    boot.release = 1;
    boot.partT = { card: 1, lockup: 1, rest: 1 };
    gsap.delayedCall(0.2, lockHeroPhoto);
    releaseFleets();
    fireReveal();
    syncStarOpacity();
    syncFogOpacity();
    try {
      boot.onDone?.();
    } catch {
      /* ignore */
    }
    boot.onDone = null;
  }

  function weaveIdle() {
    idlePairs.length = 0;
    const seen = new Set();
    const step = Math.max(1, Math.floor(STAR_COUNT / (coarse ? 48 : 80)));
    const maxD = boot.playing && boot.land > 0.2 ? 0.85 : 1.45;
    const photoLocked = skyPhotoReady && !boot.playing;
    for (let i = 0; i < STAR_COUNT && idlePairs.length < MAX_IDLE; i += step) {
      if (photoLocked && starPhoto[i]) continue;
      let best = -1;
      let bestD = maxD;
      const ax = starPos[i * 3];
      const ay = starPos[i * 3 + 1];
      for (let j = 0; j < STAR_COUNT; j++) {
        if (i === j) continue;
        if (photoLocked && starPhoto[j]) continue;
        const dx = ax - starPos[j * 3];
        const dy = ay - starPos[j * 3 + 1];
        const d = Math.hypot(dx, dy);
        if (d < bestD) {
          bestD = d;
          best = j;
        }
      }
      if (best < 0) continue;
      const key = i < best ? `${i}:${best}` : `${best}:${i}`;
      if (seen.has(key)) continue;
      seen.add(key);
      idlePairs.push(i, best);
    }
  }

  function growConstellation() {
    if (!holding || clump.length < 2 || userBonds.length >= MAX_USER) return;
    const keep = clump.slice(0, coarse ? 10 : 14);
    for (let i = 0; i < keep.length; i++) {
      const a = keep[i];
      let best = -1;
      let bestD = 1.8;
      for (let j = i + 1; j < keep.length; j++) {
        const b = keep[j];
        const dx = starPos[a * 3] - starPos[b * 3];
        const dy = starPos[a * 3 + 1] - starPos[b * 3 + 1];
        const d = Math.hypot(dx, dy);
        if (d < bestD) {
          bestD = d;
          best = b;
        }
      }
      if (best < 0) continue;
      const exists = userBonds.some(
        (bond) => (bond.a === a && bond.b === best) || (bond.a === best && bond.b === a)
      );
      if (exists) continue;
      userBonds.push({ a, b: best, life: 1 });
      if (userBonds.length >= MAX_USER) break;
    }
  }

  function writeLines(dt) {
    for (let i = userBonds.length - 1; i >= 0; i--) {
      userBonds[i].life -= dt / 7;
      if (userBonds[i].life <= 0) userBonds.splice(i, 1);
    }
    let n = 0;
    const gold = [0.831, 0.686, 0.216];
    const violet = [0.545, 0.361, 0.965];
    for (let p = 0; p < idlePairs.length && n < MAX_IDLE; p += 2) {
      const a = idlePairs[p];
      const b = idlePairs[p + 1];
      const o = n * 6;
      linePos[o] = starPos[a * 3];
      linePos[o + 1] = starPos[a * 3 + 1];
      linePos[o + 2] = starPos[a * 3 + 2];
      linePos[o + 3] = starPos[b * 3];
      linePos[o + 4] = starPos[b * 3 + 1];
      linePos[o + 5] = starPos[b * 3 + 2];
      const c = n % 3 === 0 ? gold : violet;
      for (let k = 0; k < 6; k += 3) {
        lineCol[o + k] = c[0];
        lineCol[o + k + 1] = c[1];
        lineCol[o + k + 2] = c[2];
      }
      n++;
    }
    userBonds.forEach((bond) => {
      if (n >= MAX_LINES) return;
      const o = n * 6;
      linePos[o] = starPos[bond.a * 3];
      linePos[o + 1] = starPos[bond.a * 3 + 1];
      linePos[o + 2] = starPos[bond.a * 3 + 2];
      linePos[o + 3] = starPos[bond.b * 3];
      linePos[o + 4] = starPos[bond.b * 3 + 1];
      linePos[o + 5] = starPos[bond.b * 3 + 2];
      const a = 0.45 + bond.life * 0.55;
      for (let k = 0; k < 6; k += 3) {
        lineCol[o + k] = gold[0] * a;
        lineCol[o + k + 1] = gold[1] * a;
        lineCol[o + k + 2] = gold[2] * a;
      }
      n++;
    });
    lineGeo.setDrawRange(0, n * 2);
    lineGeo.attributes.position.needsUpdate = true;
    lineGeo.attributes.color.needsUpdate = true;
  }

  function starTarget(i) {
    const spinX = starSpinX[i];
    const spinY = starSpinY[i];
    const fieldX = starBase[i * 3];
    const fieldY = starBase[i * 3 + 1];
    const part = starPart[i];
    if (part < 0) {
      const drift = Math.max(boot.icon * 0.4, boot.land * 0.55, boot.release);
      return {
        x: spinX + (fieldX - spinX) * (0.2 + drift * 0.8),
        y: spinY + (fieldY - spinY) * (0.2 + drift * 0.8),
      };
    }
    const hasIcon = Number.isFinite(starIconX[i]);
    const iconX = hasIcon ? starIconX[i] * (1 - boot.icon * 0.18) : spinX;
    const iconY = hasIcon ? starIconY[i] * (1 - boot.icon * 0.18) : spinY;
    const midX = spinX + (iconX - spinX) * boot.icon;
    const midY = spinY + (iconY - spinY) * boot.icon;
    const landT = boot.partT[SKY_PARTS[part]] || 0;
    const landX = Number.isFinite(starLandX[i]) ? starLandX[i] : fieldX;
    const landY = Number.isFinite(starLandY[i]) ? starLandY[i] : fieldY;
    const conX = midX + (landX - midX) * landT;
    const conY = midY + (landY - midY) * landT;
    if (starPhoto[i] && boot.release > 0 && landT > 0.65) {
      return { x: landX, y: landY };
    }
    if (boot.release > 0 && landT > 0.65) {
      return {
        x: conX + (fieldX - conX) * boot.release,
        y: conY + (fieldY - conY) * boot.release,
      };
    }
    return { x: conX, y: conY };
  }

  function heroWorldRect() {
    const el = document.querySelector(".hero-photo-stack") || document.getElementById("hero");
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (r.width < 8 || r.height < 8) return null;
    const c = clientToWorld(r.left + r.width / 2, r.top + r.height / 2);
    const tr = clientToWorld(r.right, r.top);
    return {
      cx: c.x,
      cy: c.y,
      hw: Math.abs(tr.x - c.x),
      hh: Math.abs(tr.y - c.y),
    };
  }

  function updateHeroOrbits(t) {
    const onHero = document.body.dataset.bg === "hero" && !boot.playing;
    const rect = onHero ? heroWorldRect() : null;
    themeGroups.forEach((group, key) => {
      const assets = group.userData.assets || [];
      const use = rect && key === activeKey;
      assets.forEach((mesh, i) => {
        const u = mesh.userData;
        if (!use) {
          u.orbit = null;
          return;
        }
        const ang = (i / Math.max(1, assets.length)) * Math.PI * 2 + t * (0.09 + previewBoost * 0.26);
        const tighten = 1 - previewBoost * 0.1;
        const radX = (rect.hw * 0.44 + 0.55 + (i % 3) * 0.22) * tighten;
        const radY = (rect.hh * 0.4 + 0.4 + (i % 2) * 0.16) * tighten;
        u.orbit = {
          x: rect.cx + Math.cos(ang) * radX,
          y: rect.cy + Math.sin(ang) * radY,
        };
      });
    });
  }

  function syncSkyVars() {
    const leave = boot.playing ? 0 : heroLeave;
    const keep = 1 - leave;
    if (coarse || reduced) {
      document.documentElement.style.setProperty("--sky-x", "0");
      document.documentElement.style.setProperty("--sky-y", "0");
      return;
    }
    document.documentElement.style.setProperty("--sky-x", (smoothPX * keep).toFixed(3));
    document.documentElement.style.setProperty("--sky-y", (smoothPY * keep).toFixed(3));
  }

  function frame() {
    if (!running) return;
    const now = performance.now();
    const idle = now - lastActivity > IDLE_MS;
    const scrollSettled = Math.abs(parallax.scrollTarget - parallax.scroll) < 0.002;
    const pointerSettled =
      Math.abs(pointerX - smoothPX) < 0.01 && Math.abs(pointerY - smoothPY) < 0.01;
    if (
      !KEEP_FLOATING &&
      !boot.playing &&
      !holding &&
      burstPow < 0.002 &&
      idle &&
      scrollSettled &&
      pointerSettled
    ) {
      renderer.render(scene, camera);
      running = false;
      raf = 0;
      return;
    }
    const dt = Math.min(0.05, clock.getDelta());
    const t = clock.elapsedTime;
    if (!reduced) {
      parallax.scroll += (parallax.scrollTarget - parallax.scroll) * PARALLAX_LERP;
      smoothPX += (pointerX - smoothPX) * POINTER_LERP;
      smoothPY += (pointerY - smoothPY) * POINTER_LERP;
      heroLeave += (heroLeaveTarget - heroLeave) * (coarse ? 0.12 : 0.08);
      document.documentElement.style.setProperty("--hero-leave", heroLeave.toFixed(3));
      syncSkyVars();
    }
    previewBoost += ((previewKey ? 1 : 0) - previewBoost) * (previewKey ? 0.16 : 0.07);
    updateHeroOrbits(t);
    const group = themeGroups.get(activeKey);
    if (group && !reduced && !fleetsHeld) {
      const scrollPull = (parallax.scroll - 0.5) * 0.7;
      const grab = holding ? 1.35 : 1;
      const onHero = document.body.dataset.bg === "hero";
      group.userData.assets.forEach((mesh) => {
        const u = mesh.userData;
        if (!u.dragging) {
          u.rest.x += u.vel.x;
          u.rest.y += u.vel.y;
          u.vel.multiplyScalar(0.92);
          if (u.vel.lengthSq() < 0.00004) u.vel.set(0, 0, 0);
          if (onHero && u.orbit && u.vel.lengthSq() < 0.0002) {
            u.rest.x += (u.orbit.x - u.rest.x) * 0.04;
            u.rest.y += (u.orbit.y - u.rest.y) * 0.04;
          }
          clampRest(u.rest);
        }
        const depth = 0.4 + Math.abs(u.rest.z) * 0.08;
        const wantHover = hoverMesh === mesh || u.dragging ? 1 : 0;
        u.hover += (wantHover - u.hover) * 0.18;
        const lift = u.dragging ? 0.12 : u.hover * 0.08;
        if (u.dragging) {
          mesh.position.set(u.rest.x, u.rest.y + lift, u.rest.z);
        } else {
          const dx =
            Math.sin(t * 0.32 + u.phase) * 0.22 * depth + smoothPX * 0.22 * depth * grab;
          const dy =
            Math.cos(t * 0.26 + u.phase * 1.3) * 0.18 * depth -
            smoothPY * 0.2 * depth * grab -
            scrollPull * 0.28 * depth;
          mesh.position.x = u.rest.x + dx;
          mesh.position.y = u.rest.y + dy + lift;
          mesh.position.z = u.rest.z + Math.sin(t * 0.2 + u.phase) * 0.08;
        }
        const idleFade = skyPhotoReady ? (coarse ? 0.22 : 0.36) : 1;
        const fade = onHero
          ? (idleFade + previewBoost * (coarse ? 0.4 : 0.56)) * (1 - heroLeave * 0.92)
          : 1;
        const s = (1 + u.hover * 0.14) * fade;
        mesh.scale.setScalar(Math.max(0.02, s));
        mesh.traverse((obj) => {
          if (obj.isMesh && obj.material && "opacity" in obj.material) {
            const baseOp = obj.userData?.kind === "spark" || u.kind === "spark" ? 0.7 : 0.42;
            obj.material.opacity = baseOp * fade;
          }
        });
        if (u.spin) {
          if (u.kind === "card") mesh.rotation.y = t * u.spin * 0.85 * u.dir;
          else mesh.rotation.z = t * u.spin * 0.85 * u.dir;
        }
      });
      root.rotation.y = smoothPX * 0.07;
      root.rotation.x = -smoothPY * 0.05;
    }
    if (!reduced) {
      const wellWX = smoothPX * 2.4;
      const wellWY = -smoothPY * 1.8;
      const drift = t;
      const pulling = boot.playing;
      const rushing = morphBoost > 0.02;
      const loosen = 0;
      if (ripples.length) {
        for (let k = ripples.length - 1; k >= 0; k--) {
          const rp = ripples[k];
          rp.r += dt * rp.speed;
          rp.life -= dt * 0.72;
          if (rp.life <= 0 || rp.r > 2.6) ripples.splice(k, 1);
        }
      }
      let colorDirty = false;
      for (let i = 0; i < STAR_COUNT; i++) {
        const depth = 0.35 + Math.abs(starBase[i * 3 + 2]) * 0.04;
        const photo = starPhoto[i];
        const twinkle = photo ? 0.003 + loosen * 0.08 : 0.09;
        const bob = photo ? 0.002 + loosen * 0.07 : 0.08;
        const home = pulling
          ? starTarget(i)
          : {
              x:
                starBase[i * 3] +
                Math.sin(drift * 0.55 + starPhase[i]) * twinkle +
                Math.sin(drift * 0.2 + starPhase[i] * 0.7) * twinkle * 0.5,
              y:
                starBase[i * 3 + 1] +
                Math.cos(drift * 0.42 + starPhase[i] * 1.15) * bob +
                Math.sin(drift * 0.16 + starPhase[i]) * bob * 0.4,
            };
        let px = starPos[i * 3];
        let py = starPos[i * 3 + 1];
        const inClump = holding && starClump[i];
        const pull = pulling
          ? photo
            ? 0.09
            : 0.042
          : photo && rushing
            ? 0.04 + morphBoost * 0.05
            : photo
              ? 0.038
              : 0.03;
        if (!photo && !pulling && holding && inClump) {
          starVel[i * 2] += (wellWX - px) * 0.08 * depth;
          starVel[i * 2 + 1] += (wellWY - py) * 0.08 * depth;
        } else if (!photo && !pulling && holding) {
          starVel[i * 2] += (wellWX - px) * 0.02 * depth;
          starVel[i * 2 + 1] += (wellWY - py) * 0.02 * depth;
        } else {
          starVel[i * 2] += (home.x - px) * pull;
          starVel[i * 2 + 1] += (home.y - py) * pull;
          if (!pulling && !rushing) {
            starVel[i * 2] += wellWX * (photo ? 0.008 * loosen : 0.012) * depth;
            starVel[i * 2 + 1] += wellWY * (photo ? 0.008 * loosen : 0.012) * depth;
          }
        }
        if (photo && ripples.length) {
          for (let k = 0; k < ripples.length; k++) {
            const rp = ripples[k];
            const dx = px - rp.x;
            const dy = py - rp.y;
            const d = Math.hypot(dx, dy) + 0.0001;
            const band = Math.abs(d - rp.r);
            if (band < 0.3) {
              const wave = (1 - band / 0.3) * rp.life * 0.048;
              starVel[i * 2] += (dx / d) * wave;
              starVel[i * 2 + 1] += (dy / d) * wave;
            }
          }
        } else if (!photo && burstPow > 0.002) {
          const dx = px - burstX;
          const dy = py - burstY;
          const f = (burstPow * 1.1) / (dx * dx + dy * dy + 0.55);
          starVel[i * 2] += dx * f;
          starVel[i * 2 + 1] += dy * f;
        }
        starVel[i * 2] *= pulling || rushing ? 0.9 : 0.935;
        starVel[i * 2 + 1] *= pulling || rushing ? 0.9 : 0.935;
        px += starVel[i * 2];
        py += starVel[i * 2 + 1];
        starPos[i * 3] = px;
        starPos[i * 3 + 1] = py;
        const colorT = pulling ? boot.partT.card || 0 : photo ? (rushing ? 0.08 : 0.12) : 0;
        if (photo && colorT > 0.001) {
          const k = Math.min(1, colorT);
          starColor[i * 3] += (starColorTarget[i * 3] - starColor[i * 3]) * k;
          starColor[i * 3 + 1] += (starColorTarget[i * 3 + 1] - starColor[i * 3 + 1]) * k;
          starColor[i * 3 + 2] += (starColorTarget[i * 3 + 2] - starColor[i * 3 + 2]) * k;
          colorDirty = true;
        }
      }
      if (rushing) morphBoost *= 0.9;
      burstPow *= 0.72;
      starGeo.attributes.position.needsUpdate = true;
      if (colorDirty) starGeo.attributes.color.needsUpdate = true;

      if ((!coarse || !boot.playing) && now - lastWeave > (coarse ? 900 : 480)) {
        weaveIdle();
        lastWeave = now;
      }
      if (holding && now - lastGrow > 80) {
        growConstellation();
        lastGrow = now;
      }
      writeLines(dt);

      if (liveGridMats[0] && liveGridMats[0].opacity > 0.01) {
        liveGrid.position.x = smoothPX * 0.25;
        liveGrid.position.y = Math.sin(t * 0.22) * 0.08 - smoothPY * 0.16;
      }
      nebulae.forEach((n, idx) => {
        n.sprite.position.x += Math.sin(t * 0.07 + idx) * 0.002;
        n.sprite.position.y += Math.cos(t * 0.05 + idx) * 0.0015;
      });
    }
    if (!boot.playing && (document.body.dataset.bg === "hero" || heroLeave > 0)) {
      const want = desiredStarOpacity();
      if (Math.abs(starMat.opacity - want) > 0.02) starMat.opacity += (want - starMat.opacity) * 0.08;
      const lineWant = desiredLineOpacity();
      if (Math.abs(lineMat.opacity - lineWant) > 0.02) lineMat.opacity += (lineWant - lineMat.opacity) * 0.08;
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
      endDrag();
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
    if (boot.playing) assignLandTargets();
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

  if (!fleetsHeld) {
    for (let i = 0; i < STAR_COUNT; i++) {
      starPos[i * 3] = starBase[i * 3];
      starPos[i * 3 + 1] = starBase[i * 3 + 1];
    }
    starGeo.attributes.position.needsUpdate = true;
    if (
      !boot.playing &&
      !document.documentElement.hasAttribute("data-intro") &&
      !document.documentElement.classList.contains("is-intro-pending")
    ) {
      lockHeroPhoto();
    }
  } else {
    weaveIdle();
  }

  syncShortLandscape();
  if (running) raf = requestAnimationFrame(frame);

  return {
    setTheme,
    previewFleet,
    scout,
    resize,
    playSkyIntro,
    skipSkyIntro,
    setHeroScene,
    dispose() {
      running = false;
      cancelAnimationFrame(raf);
      stopBootTimeline();
      markSkyPhoto(false);
      document.documentElement.classList.remove("has-webgl-sky");
      starGeo.dispose();
      starMat.dispose();
      lineGeo.dispose();
      lineMat.dispose();
      nebulae.forEach((n) => {
        n.tex.dispose();
        n.mat.dispose();
      });
      liveGrid.geometry.dispose();
      liveGridMats.forEach((m) => m.dispose());
      renderer.dispose();
    },
  };
}
     