/* Panel WebGL scenes: 2HH + Badugi cards */
import * as THREE from "three";
import gsap from "gsap";
import { drawingDpr } from "./pref.js";

const tableCoarse =
  typeof matchMedia !== "undefined" && matchMedia("(pointer: coarse)").matches;
const DRAG_PX = 8;

const reduced =
  typeof matchMedia !== "undefined" &&
  matchMedia("(prefers-reduced-motion: reduce)").matches;

function watchAttract(canvas, key, fn) {
  if (!canvas || reduced) return;
  try {
    if (sessionStorage.getItem(key)) return;
  } catch (_) {}
  let fired = false;
  const run = () => {
    if (fired) return;
    fired = true;
    try {
      sessionStorage.setItem(key, "1");
    } catch (_) {}
    window.setTimeout(fn, 900);
  };
  if (typeof IntersectionObserver === "undefined") {
    run();
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      const hit = entries.some((e) => e.isIntersecting && e.intersectionRatio > 0.2);
      if (!hit) return;
      if (canvas.closest("[hidden]")) return;
      io.disconnect();
      run();
    },
    { threshold: 0.25 }
  );
  io.observe(canvas);
}

function makeRenderer(canvas) {
  const coarse =
    typeof matchMedia !== "undefined" && matchMedia("(pointer: coarse)").matches;
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: false,
    antialias: !coarse,
    powerPreference: "high-performance",
  });
  renderer.setClearColor(0x08080c, 1);
  renderer.setPixelRatio(drawingDpr());
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  return renderer;
}

function fitRenderer(renderer, camera, canvas, fallbackW, fallbackH) {
  renderer.setPixelRatio(drawingDpr());
  const rect = canvas.getBoundingClientRect();
  const cssW = Math.max(1, Math.round(rect.width || canvas.clientWidth || fallbackW));
  const cssH = Math.max(1, Math.round(rect.height || canvas.clientHeight || fallbackH));
  const dpr = renderer.getPixelRatio();
  const bw = Math.round(cssW * dpr);
  const bh = Math.round(cssH * dpr);
  if (canvas.width !== bw || canvas.height !== bh) {
    renderer.setSize(cssW, cssH, false);
    camera.aspect = cssW / cssH;
    camera.updateProjectionMatrix();
  }
  return { w: cssW, h: cssH };
}

function watchCanvasBox(canvas, fit) {
  if (typeof ResizeObserver !== "undefined") {
    const ro = new ResizeObserver(() => fit());
    ro.observe(canvas);
  }
  window.addEventListener("resize", fit, { passive: true });
}

function applyMapQuality(tex, renderer) {
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = renderer?.capabilities?.getMaxAnisotropy?.() || 4;
  tex.needsUpdate = true;
  return tex;
}

function makeDrawCanvas(cssW, cssH) {
  const dpr = reduced ? 1 : Math.max(2, drawingDpr());
  const c = document.createElement("canvas");
  c.width = Math.round(cssW * dpr);
  c.height = Math.round(cssH * dpr);
  const ctx = c.getContext("2d");
  ctx.scale(dpr, dpr);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  return { c, ctx };
}

function cardFaceTexture(rank, suit) {
  const { c, ctx } = makeDrawCanvas(256, 360);
  const red = suit === "♥" || suit === "♦";
  const ink = red ? "#b91c1c" : "#141414";

  const grad = ctx.createLinearGradient(0, 0, 0, 360);
  grad.addColorStop(0, "#fffcf6");
  grad.addColorStop(1, "#efe8dc");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 360);

  ctx.strokeStyle = "#c4b8a4";
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, 236, 340);
  ctx.strokeStyle = "#2a2a2e";
  ctx.lineWidth = 2;
  ctx.strokeRect(18, 18, 220, 324);

  ctx.fillStyle = ink;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "700 54px Space Grotesk, IBM Plex Sans, system-ui, sans-serif";
  ctx.fillText(rank, 48, 52);
  ctx.font = "48px Space Grotesk, IBM Plex Sans, system-ui, sans-serif";
  ctx.fillText(suit, 48, 104);
  ctx.font = "120px Space Grotesk, IBM Plex Sans, system-ui, sans-serif";
  ctx.globalAlpha = 0.92;
  ctx.fillText(suit, 128, 190);
  ctx.globalAlpha = 1;
  ctx.save();
  ctx.translate(208, 308);
  ctx.rotate(Math.PI);
  ctx.font = "700 54px Space Grotesk, IBM Plex Sans, system-ui, sans-serif";
  ctx.fillText(rank, 0, 0);
  ctx.font = "48px Space Grotesk, IBM Plex Sans, system-ui, sans-serif";
  ctx.fillText(suit, 0, 52);
  ctx.restore();

  return applyMapQuality(new THREE.CanvasTexture(c));
}

function cardBackTexture(tint) {
  const { c, ctx } = makeDrawCanvas(256, 360);
  const base = tint || "#1e3a5f";
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 256, 360);
  ctx.strokeStyle = "rgba(212,175,55,0.55)";
  ctx.lineWidth = 8;
  ctx.strokeRect(14, 14, 228, 332);
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.moveTo(28 + i * 28, 28);
    ctx.lineTo(28 + i * 28, 332);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(212,175,55,0.85)";
  ctx.font = "700 36px IBM Plex Mono, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("D22", 128, 180);
  return applyMapQuality(new THREE.CanvasTexture(c));
}

function makeCardMesh(rank, suit, opts) {
  const geo = new THREE.BoxGeometry(0.72, 1.02, 0.045);
  const face = new THREE.MeshBasicMaterial({ map: cardFaceTexture(rank, suit) });
  const back = new THREE.MeshBasicMaterial({
    map: cardBackTexture(opts?.backTint),
  });
  const edge = new THREE.MeshBasicMaterial({ color: 0xd8d2c6 });
  const mesh = new THREE.Mesh(geo, [edge, edge, edge, edge, face, back]);
  mesh.userData.rank = rank;
  mesh.userData.suit = suit;
  mesh.userData.dispose = () => {
    geo.dispose();
    [face, back, edge].forEach((m) => {
      m.map?.dispose();
      m.dispose();
    });
  };
  return mesh;
}

function makeFeltTable(radius, feltColor, railColor) {
  const group = new THREE.Group();
  const felt = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 64),
    new THREE.MeshBasicMaterial({ color: feltColor })
  );
  felt.rotation.x = -Math.PI / 2;
  group.add(felt);

  const rail = new THREE.Mesh(
    new THREE.RingGeometry(radius * 0.92, radius * 1.06, 64),
    new THREE.MeshBasicMaterial({
      color: railColor,
      transparent: true,
      opacity: 0.88,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  rail.rotation.x = -Math.PI / 2;
  rail.position.y = 0.01;
  group.add(rail);

  const inner = new THREE.Mesh(
    new THREE.RingGeometry(radius * 0.55, radius * 0.58, 64),
    new THREE.MeshBasicMaterial({
      color: 0xd4af37,
      transparent: true,
      opacity: 0.14,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  inner.rotation.x = -Math.PI / 2;
  inner.position.y = 0.012;
  group.add(inner);
  return group;
}

function makeHudLabel(width, height, color) {
  const { c: canvas, ctx } = makeDrawCanvas(640, 96);
  const tex = applyMapQuality(new THREE.CanvasTexture(canvas));
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })
  );
  mesh.userData.paint = (text) => {
    ctx.clearRect(0, 0, 640, 96);
    ctx.fillStyle = "rgba(8, 10, 14, 0.55)";
    ctx.fillRect(0, 12, 640, 72);
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.45;
    ctx.strokeRect(4, 16, 632, 64);
    ctx.globalAlpha = 1;
    ctx.fillStyle = color;
    ctx.font = "600 28px IBM Plex Mono, monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 28, 48);
    tex.needsUpdate = true;
  };
  return mesh;
}

function makeZoneLabel(text, color) {
  const { c: canvas, ctx } = makeDrawCanvas(256, 64);
  ctx.fillStyle = color;
  ctx.font = "700 28px IBM Plex Mono, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.globalAlpha = 0.9;
  ctx.fillText(text, 128, 32);
  const tex = applyMapQuality(new THREE.CanvasTexture(canvas));
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1.4, 0.32),
    new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    })
  );
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}

function observeVisibility(canvas, onChange) {
  let visible = false;
  if ("IntersectionObserver" in window) {
    const obs = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting && e.intersectionRatio > 0;
        onChange?.(visible);
      },
      { rootMargin: "80px 0px", threshold: 0.01 }
    );
    obs.observe(canvas);
  } else {
    visible = true;
    onChange?.(true);
  }
  return () => visible;
}

/** rAF only while intersecting — fit on resize / become-visible, not every frame */
function bindVisibleLoop(canvas, tick, { onHide } = {}) {
  let raf = 0;
  const isVisible = observeVisibility(canvas, (vis) => {
    if (vis) {
      if (!raf) {
        tick(true); // allow one fit+render on show
        raf = requestAnimationFrame(loop);
      }
    } else {
      cancelAnimationFrame(raf);
      raf = 0;
      onHide?.();
    }
  });
  function loop() {
    if (!isVisible()) {
      raf = 0;
      return;
    }
    tick(false);
    raf = requestAnimationFrame(loop);
  }
  return { isVisible };
}

function ndcFromEvent(canvas, e, pointer) {
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  return rect;
}

function hitCard(raycaster, camera, pointer, cards) {
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(cards, false);
  return hits.length ? hits[0].object : null;
}

function intersectTable(raycaster, camera, pointer, y, out) {
  raycaster.setFromCamera(pointer, camera);
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -y);
  return raycaster.ray.intersectPlane(plane, out) ? out : null;
}

function clampTable(v) {
  v.x = Math.max(-2.4, Math.min(2.4, v.x));
  v.z = Math.max(-1.85, Math.min(2.05, v.z));
}

function setCardGrab(on) {
  document.body.classList.toggle("is-dragging-card", !!on);
}

/* ---------- 2 HAND HOLD'EM ---------- */
function init2HH(canvas) {
  if (!canvas) return;

  const suits = ["♠", "♥", "♦", "♣"];
  const ranks = ["A", "K", "Q", "J", "T", "9", "8"];
  const pick = () => ({
    rank: ranks[(Math.random() * ranks.length) | 0],
    suit: suits[(Math.random() * suits.length) | 0],
  });

  const renderer = makeRenderer(canvas);
  renderer.setClearColor(0x07140e, 1);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 40);
  camera.position.set(0, 4.1, 5.4);
  camera.lookAt(0, 0.15, 0.1);

  scene.add(makeFeltTable(3.25, 0x0d2818, 0x3f2a14));

  /* Soft felt wash */
  const wash = new THREE.Mesh(
    new THREE.CircleGeometry(2.4, 48),
    new THREE.MeshBasicMaterial({
      color: 0x1a5c3a,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
    })
  );
  wash.rotation.x = -Math.PI / 2;
  wash.position.y = 0.008;
  scene.add(wash);

  const handBoxes = [
    new THREE.Mesh(
      new THREE.PlaneGeometry(2.35, 1.55),
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    ),
    new THREE.Mesh(
      new THREE.PlaneGeometry(2.35, 1.55),
      new THREE.MeshBasicMaterial({
        color: 0xfb7185,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    ),
  ];
  handBoxes[0].rotation.x = -Math.PI / 2;
  handBoxes[1].rotation.x = -Math.PI / 2;
  handBoxes[0].position.set(-1.45, 0.03, 1.15);
  handBoxes[1].position.set(1.45, 0.03, 1.15);
  scene.add(...handBoxes);

  const zoneA = makeZoneLabel("HAND A", "#7dd3fc");
  const zoneB = makeZoneLabel("HAND B", "#fda4af");
  zoneA.position.set(-1.45, 0.04, 0.35);
  zoneB.position.set(1.45, 0.04, 0.35);
  scene.add(zoneA, zoneB);

  const boardTag = makeZoneLabel("BOARD", "#d4af37");
  boardTag.position.set(0, 0.04, -1.35);
  boardTag.material.opacity = 0.55;
  scene.add(boardTag);

  /* Pot chips */
  [0x8b5cf6, 0xd4af37, 0x2dd4bf].forEach((color, i) => {
    const chip = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.14, 0.04, 24),
      new THREE.MeshBasicMaterial({ color })
    );
    chip.position.set(-0.22 + i * 0.22, 0.04 + i * 0.02, 0.15);
    scene.add(chip);
  });

  const label = makeHudLabel(4.4, 0.42, "#d4af37");
  label.position.set(0, 0.9, -2.35);
  label.lookAt(camera.position);
  scene.add(label);
  label.userData.paint("DEALT — CLICK TO SPLIT INTO TWO HANDS");

  let hole = [];
  let board = [];
  let split = false;
  let busy = false;
  let layoutUntil = 0;

  function allCards() {
    return hole.concat(board);
  }

  function disposeCards(list) {
    list.forEach((m) => {
      scene.remove(m);
      m.userData.dispose?.();
    });
  }

  function seedCard(m, i) {
    m.userData.phase = i * 1.3;
    m.userData.free = false;
    m.userData.dragging = false;
    m.userData.vx = 0;
    m.userData.vz = 0;
    m.userData.restY = 0.52;
  }

  function dealFresh() {
    disposeCards(hole);
    disposeCards(board);
    hole = [pick(), pick(), pick(), pick()].map((c) =>
      makeCardMesh(c.rank, c.suit, { backTint: "#12304f" })
    );
    board = [pick(), pick(), pick()].map((c) =>
      makeCardMesh(c.rank, c.suit, { backTint: "#12304f" })
    );
    hole.forEach((m, i) => {
      seedCard(m, i);
      m.position.set(-0.9 + i * 0.22, 1.1, 2.4);
      m.rotation.set(-0.4, 0, 0);
      m.scale.setScalar(0.85);
      scene.add(m);
    });
    board.forEach((m, i) => {
      seedCard(m, i + 4);
      m.position.set(-0.4 + i * 0.2, 1.2, -1.6);
      m.rotation.set(-0.5, 0, 0);
      m.scale.setScalar(0.85);
      scene.add(m);
    });
  }

  function layout(animate, { dealArc = false } = {}) {
    const duration = reduced || !animate ? 0.01 : dealArc ? 0.52 : 0.65;
    const ease = dealArc ? "power2.inOut" : "power3.out";
    layoutUntil = performance.now() + (duration + (dealArc ? 0.45 : 0.2)) * 1000;
    hole.forEach((m, i) => {
      let x;
      let z;
      let rotY = 0;
      if (!split) {
        x = -1.2 + i * 0.8;
        z = 1.2;
      } else {
        const hand = i < 2 ? 0 : 1;
        x = (hand === 0 ? -1.85 : 0.95) + (i % 2) * 0.78;
        z = 1.2;
        rotY = hand === 0 ? -0.08 : 0.08;
      }
      m.userData.free = false;
      m.userData.dragging = false;
      m.userData.vx = 0;
      m.userData.vz = 0;
      m.userData.restX = x;
      m.userData.restY = 0.52;
      m.userData.restZ = z;
      const delay = reduced ? 0 : i * (dealArc ? 0.055 : 0.04);
      if (dealArc && animate && !reduced) {
        gsap.to(m.position, {
          x,
          y: 1.18,
          z,
          duration: 0.26,
          delay,
          ease: "power2.out",
          overwrite: "auto",
          onComplete: () => {
            gsap.to(m.position, {
              y: 0.52,
              duration: 0.3,
              ease: "power3.in",
              overwrite: "auto",
            });
          },
        });
        gsap.fromTo(
          m.rotation,
          { x: -0.42, y: rotY, z: (i - 1.5) * 0.1 },
          { x: -0.18, y: rotY, z: 0, duration: 0.54, delay, ease: "power3.out", overwrite: "auto" }
        );
      } else {
        gsap.to(m.position, {
          x,
          y: 0.52,
          z,
          duration,
          delay,
          ease,
          overwrite: "auto",
        });
        gsap.to(m.rotation, {
          x: -0.18,
          y: rotY,
          z: 0,
          duration,
          ease,
          overwrite: "auto",
        });
      }
      gsap.to(m.scale, { x: 1, y: 1, z: 1, duration, ease, overwrite: "auto" });
    });
    board.forEach((m, i) => {
      const x = -0.85 + i * 0.85;
      const z = -0.55;
      m.userData.free = false;
      m.userData.dragging = false;
      m.userData.vx = 0;
      m.userData.vz = 0;
      m.userData.restX = x;
      m.userData.restY = 0.52;
      m.userData.restZ = z;
      const delay = reduced ? 0 : 0.12 + i * 0.05;
      gsap.to(m.position, {
        x,
        y: dealArc && animate && !reduced ? 0.92 : 0.52,
        z,
        duration: dealArc && animate && !reduced ? 0.24 : duration,
        delay,
        ease: dealArc ? "power2.out" : ease,
        overwrite: "auto",
        onComplete:
          dealArc && animate && !reduced
            ? () => {
                gsap.to(m.position, {
                  y: 0.52,
                  duration: 0.28,
                  ease: "power3.in",
                  overwrite: "auto",
                });
              }
            : undefined,
      });
      gsap.to(m.rotation, { x: -0.18, y: 0, z: 0, duration, ease, overwrite: "auto" });
      gsap.to(m.scale, { x: 1, y: 1, z: 1, duration, ease, overwrite: "auto" });
    });
    handBoxes.forEach((b) => {
      gsap.to(b.material, {
        opacity: split ? 0.2 : 0,
        duration: duration * 0.8,
        overwrite: "auto",
      });
    });
    gsap.to(zoneA.material, { opacity: split ? 0.85 : 0, duration, overwrite: "auto" });
    gsap.to(zoneB.material, { opacity: split ? 0.85 : 0, duration, overwrite: "auto" });
  }

  dealFresh();
  layout(true, { dealArc: true });

  let userTouched = false;
  canvas.addEventListener(
    "pointerdown",
    () => {
      userTouched = true;
    },
    { capture: true }
  );

  function cycleTable() {
    if (busy) return;
    if (split) {
      busy = true;
      split = false;
      dealFresh();
      label.userData.paint("DEALT — CLICK TO SPLIT INTO TWO HANDS");
      layout(true, { dealArc: true });
      window.setTimeout(() => {
        busy = false;
      }, reduced ? 40 : 780);
      return;
    }
    split = true;
    label.userData.paint("TWO HANDS // ONE BOARD — CLICK TO REDEAL");
    layout(true, { dealArc: true });
  }

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const tableHit = new THREE.Vector3();
  let drag = null;
  let dragStart = { x: 0, y: 0 };
  let didDrag = false;

  function cycleOrIgnore() {
    if (!didDrag) cycleTable();
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (busy || reduced) return;
    ndcFromEvent(canvas, e, pointer);
    const hit = tableCoarse ? null : hitCard(raycaster, camera, pointer, allCards());
    if (!hit) {
      drag = null;
      didDrag = false;
      return;
    }
    gsap.killTweensOf(hit.position);
    drag = hit;
    didDrag = false;
    dragStart.x = e.clientX;
    dragStart.y = e.clientY;
    hit.userData.dragging = true;
    hit.userData.vx = 0;
    hit.userData.vz = 0;
    canvas.setPointerCapture?.(e.pointerId);
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!drag) {
      if (tableCoarse || reduced) return;
      ndcFromEvent(canvas, e, pointer);
      canvas.style.cursor = hitCard(raycaster, camera, pointer, allCards())
        ? "grab"
        : "pointer";
      return;
    }
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    if (!didDrag && dx * dx + dy * dy < DRAG_PX * DRAG_PX) return;
    didDrag = true;
    setCardGrab(true);
    canvas.style.cursor = "grabbing";
    ndcFromEvent(canvas, e, pointer);
    const p = intersectTable(raycaster, camera, pointer, 0.52, tableHit);
    if (!p) return;
    clampTable(p);
    const prevX = drag.userData.restX ?? drag.position.x;
    const prevZ = drag.userData.restZ ?? drag.position.z;
    drag.userData.restX = p.x;
    drag.userData.restY = 0.62;
    drag.userData.restZ = p.z;
    drag.userData.vx = p.x - prevX;
    drag.userData.vz = p.z - prevZ;
    drag.position.set(p.x, 0.62, p.z);
  });

  function endCardDrag() {
    if (!drag) return;
    drag.userData.dragging = false;
    if (didDrag) {
      drag.userData.free = true;
      drag.userData.restY = 0.52;
    }
    setCardGrab(false);
    canvas.style.cursor = "pointer";
    const moved = didDrag;
    drag = null;
    return moved;
  }

  canvas.addEventListener("pointerup", (e) => {
    const moved = endCardDrag();
    if (moved) return;
    if (e.target === canvas) cycleOrIgnore();
  });
  canvas.addEventListener("pointercancel", () => {
    endCardDrag();
  });
  canvas.style.cursor = "pointer";

  watchAttract(canvas, "d22-attract-2hh", () => {
    if (userTouched || split || busy) return;
    cycleTable();
  });

  let clock = 0;
  const fit = () => fitRenderer(renderer, camera, canvas, 480, 300);
  fit();
  watchCanvasBox(canvas, fit);
  bindVisibleLoop(canvas, (first) => {
    if (first) fit();
    clock += 0.016;
    if (!reduced) {
      camera.position.x = Math.sin(clock * 0.22) * 0.12;
      camera.position.y = 4.1 + Math.sin(clock * 0.18) * 0.04;
      camera.lookAt(0, 0.15, 0.1);
      label.lookAt(camera.position);
      if (performance.now() > layoutUntil) {
        allCards().forEach((m, i) => {
          if (m.userData.dragging) return;
          if (m.userData.free) {
            m.userData.restX += m.userData.vx;
            m.userData.restZ += m.userData.vz;
            m.userData.vx *= 0.88;
            m.userData.vz *= 0.88;
            const tmp = { x: m.userData.restX, z: m.userData.restZ };
            clampTable(tmp);
            m.userData.restX = tmp.x;
            m.userData.restZ = tmp.z;
            m.position.x = m.userData.restX;
            m.position.z = m.userData.restZ;
          }
          const restY = m.userData.restY ?? 0.52;
          m.position.y = restY + Math.sin(clock * 1.5 + (m.userData.phase || i)) * 0.028;
        });
      }
    }
    renderer.render(scene, camera);
  });
}
function initBadugi(canvas) {
  if (!canvas) return;

  const suits = ["♠", "♥", "♦", "♣"];
  const ranks = ["A", "2", "3", "4", "5", "6", "7", "8"];
  const pick = () => ({
    rank: ranks[(Math.random() * ranks.length) | 0],
    suit: suits[(Math.random() * suits.length) | 0],
  });

  const renderer = makeRenderer(canvas);
  renderer.setClearColor(0x070b12, 1);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 40);
  camera.position.set(0, 3.9, 5.2);
  camera.lookAt(0, 0.2, 0.15);

  scene.add(makeFeltTable(3.1, 0x0f172a, 0x334155));

  const iceWash = new THREE.Mesh(
    new THREE.CircleGeometry(2.2, 48),
    new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.07,
      depthWrite: false,
    })
  );
  iceWash.rotation.x = -Math.PI / 2;
  iceWash.position.y = 0.008;
  scene.add(iceWash);

  /* Triad geometry under community */
  const triad = new THREE.Mesh(
    new THREE.RingGeometry(1.55, 1.68, 3),
    new THREE.MeshBasicMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  triad.rotation.x = -Math.PI / 2;
  triad.rotation.z = Math.PI / 6;
  triad.position.set(0, 0.02, 0.15);
  scene.add(triad);

  const pickRing = new THREE.Mesh(
    new THREE.RingGeometry(0.48, 0.56, 32),
    new THREE.MeshBasicMaterial({
      color: 0xe0f2fe,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  pickRing.rotation.x = -Math.PI / 2;
  pickRing.position.y = 0.03;
  scene.add(pickRing);

  const holeTag = makeZoneLabel("YOUR HAND", "#94a3b8");
  holeTag.position.set(0, 0.04, 1.85);
  holeTag.material.opacity = 0.7;
  scene.add(holeTag);

  const communityTag = makeZoneLabel("PICK 1", "#e0f2fe");
  communityTag.position.set(0, 0.04, -0.85);
  communityTag.material.opacity = 0.75;
  scene.add(communityTag);

  const label = makeHudLabel(4.4, 0.42, "#94a3b8");
  label.position.set(0, 0.85, -2.2);
  label.lookAt(camera.position);
  scene.add(label);
  label.userData.paint("PICK 1 OF 3 COMMUNITY CARDS");

  let hole = [];
  let community = [];
  let picked = false;
  let hoverIdx = -1;
  let layoutUntil = 0;

  function disposeCards(list) {
    list.forEach((m) => {
      scene.remove(m);
      m.userData.dispose?.();
    });
  }

  function seedToy(m, i) {
    m.userData.phase = i * 1.2;
    m.userData.free = false;
    m.userData.dragging = false;
    m.userData.vx = 0;
    m.userData.vz = 0;
    m.userData.restY = 0.55;
  }

  function makeDeal() {
    disposeCards(hole);
    disposeCards(community);
    hole = [pick(), pick(), pick(), pick()].map((c) =>
      makeCardMesh(c.rank, c.suit, { backTint: "#1e293b" })
    );
    community = [pick(), pick(), pick()].map((c, i) => {
      const mesh = makeCardMesh(c.rank, c.suit, { backTint: "#1e293b" });
      mesh.userData.idx = i;
      mesh.userData.chosen = false;
      mesh.userData.rejected = false;
      return mesh;
    });
    hole.forEach((m, i) => seedToy(m, i));
    community.forEach((m, i) => seedToy(m, i + 4));
    hole.forEach((m, i) => {
      m.position.set(-1.15 + i * 0.28, 1.0, 2.5);
      m.rotation.set(-0.45, 0, 0);
      scene.add(m);
    });
    community.forEach((m, i) => {
      m.position.set(-1.0 + i * 0.7, 1.1, 1.4);
      m.rotation.set(-0.4, 0, 0);
      scene.add(m);
    });
  }

  function layout(animate) {
    const duration = reduced || !animate ? 0.01 : 0.55;
    const ease = "power3.out";
    layoutUntil = performance.now() + (duration + 0.2) * 1000;

    hole.forEach((m, i) => {
      m.userData.free = false;
      m.userData.dragging = false;
      m.userData.restX = -1.2 + i * 0.8;
      m.userData.restY = 0.5;
      m.userData.restZ = 1.55;
      gsap.to(m.position, {
        x: -1.2 + i * 0.8,
        y: 0.5,
        z: 1.55,
        duration,
        delay: reduced ? 0 : i * 0.03,
        ease,
        overwrite: "auto",
      });
      gsap.to(m.rotation, { x: -0.22, y: 0, z: 0, duration, ease, overwrite: "auto" });
    });

    community.forEach((m, i) => {
      let x;
      let z;
      let y = 0.55;
      let opacity = 1;
      let scale = 1;
      if (m.userData.chosen) {
        x = 0;
        z = 0.55;
        y = 0.72;
        scale = 1.12;
      } else if (m.userData.rejected) {
        x = -1.5 + i * 1.5;
        z = 2.6;
        y = -0.4;
        opacity = 0;
        scale = 0.7;
      } else {
        x = -1.45 + i * 1.45;
        z = 0.05;
        if (hoverIdx === i && !picked) y = 0.72;
      }
      m.userData.free = false;
      m.userData.dragging = false;
      m.userData.restX = x;
      m.userData.restY = y;
      m.userData.restZ = z;
      if (m.userData.holdDrag) return;
      gsap.to(m.position, { x, y, z, duration, ease, overwrite: "auto" });
      gsap.to(m.rotation, {
        x: -0.22,
        y: m.userData.chosen ? 0.12 : 0,
        z: 0,
        duration,
        ease,
        overwrite: "auto",
      });
      gsap.to(m.scale, { x: scale, y: scale, z: scale, duration, ease, overwrite: "auto" });
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      mats.forEach((mat) => {
        mat.transparent = true;
        gsap.to(mat, { opacity, duration, overwrite: "auto" });
      });
    });

    if (community.some((m) => m.userData.chosen)) {
      gsap.to(pickRing.position, {
        x: 0,
        z: 0.55,
        duration,
        ease,
        overwrite: "auto",
      });
      gsap.to(pickRing.material, { opacity: 0.75, duration, overwrite: "auto" });
    } else {
      gsap.to(pickRing.material, { opacity: 0, duration: 0.25, overwrite: "auto" });
    }
  }

  makeDeal();
  layout(true);

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const pickProj = new THREE.Vector3();

  function pointerNdc(e) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    return rect;
  }

  function resolveIndex(e) {
    pointerNdc(e);
    raycaster.setFromCamera(pointer, camera);
    const pickable = community.filter((m) => !m.userData.rejected);
    const hits = raycaster.intersectObjects(pickable, false);
    if (hits.length) return community.indexOf(hits[0].object);
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    let best = -1;
    let bestD = Infinity;
    pickable.forEach((m) => {
      pickProj.copy(m.position).project(camera);
      const sx = (pickProj.x + 1) / 2;
      const d = Math.abs(sx - x);
      if (d < bestD) {
        bestD = d;
        best = community.indexOf(m);
      }
    });
    return bestD < 0.22 ? best : -1;
  }

  function resetDeal() {
    picked = false;
    hoverIdx = -1;
    makeDeal();
    label.userData.paint("PICK 1 OF 3 COMMUNITY CARDS");
    communityTag.material.opacity = 0.75;
    layout(true);
  }

  function chooseCommunity(idx) {
    if (idx < 0) return;
    community.forEach((m, i) => {
      m.userData.chosen = i === idx;
      m.userData.rejected = i !== idx;
      m.userData.free = false;
      m.userData.holdDrag = false;
    });
    picked = true;
    hoverIdx = -1;
    label.userData.paint("HAND COMPLETE — CLICK TO RESET");
    communityTag.material.opacity = 0.35;
    layout(true);
  }

  function nearPickSlot(pos) {
    return Math.abs(pos.x) < 0.55 && Math.abs(pos.z - 0.55) < 0.55;
  }

  const tableHit = new THREE.Vector3();
  let drag = null;
  let dragStart = { x: 0, y: 0 };
  let didDrag = false;

  canvas.addEventListener("pointermove", (e) => {
    if (drag) {
      if (tableCoarse || reduced) return;
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      if (!didDrag && dx * dx + dy * dy < DRAG_PX * DRAG_PX) return;
      didDrag = true;
      setCardGrab(true);
      canvas.style.cursor = "grabbing";
      ndcFromEvent(canvas, e, pointer);
      const p = intersectTable(raycaster, camera, pointer, 0.62, tableHit);
      if (!p) return;
      clampTable(p);
      const prevX = drag.userData.restX ?? drag.position.x;
      const prevZ = drag.userData.restZ ?? drag.position.z;
      drag.userData.restX = p.x;
      drag.userData.restY = 0.68;
      drag.userData.restZ = p.z;
      drag.userData.vx = p.x - prevX;
      drag.userData.vz = p.z - prevZ;
      drag.position.set(p.x, 0.68, p.z);
      return;
    }
    if (picked || reduced) return;
    const idx = resolveIndex(e);
    if (idx === hoverIdx) return;
    hoverIdx = idx;
    canvas.style.cursor = idx >= 0 ? "grab" : "pointer";
    community.forEach((m, i) => {
      if (m.userData.rejected || m.userData.chosen || m.userData.dragging) return;
      gsap.to(m.position, {
        y: i === hoverIdx ? 0.72 : 0.55,
        duration: 0.22,
        ease: "power2.out",
        overwrite: "auto",
      });
    });
  });

  canvas.addEventListener("pointerdown", (e) => {
    if (reduced) return;
    if (picked) {
      drag = null;
      didDrag = false;
      return;
    }
    if (tableCoarse) return;
    const idx = resolveIndex(e);
    const hit = idx >= 0 ? community[idx] : null;
    if (!hit || hit.userData.rejected) return;
    gsap.killTweensOf(hit.position);
    drag = hit;
    didDrag = false;
    dragStart.x = e.clientX;
    dragStart.y = e.clientY;
    hit.userData.dragging = true;
    hit.userData.holdDrag = true;
    hit.userData.vx = 0;
    hit.userData.vz = 0;
    canvas.setPointerCapture?.(e.pointerId);
  });

  canvas.addEventListener("pointerup", (e) => {
    if (picked && !didDrag) {
      resetDeal();
      return;
    }
    if (!drag) {
      if (!picked && !tableCoarse) {
        const idx = resolveIndex(e);
        if (idx >= 0) chooseCommunity(idx);
      } else if (!picked && tableCoarse) {
        const idx = resolveIndex(e);
        if (idx >= 0) chooseCommunity(idx);
      }
      return;
    }
    const card = drag;
    const idx = community.indexOf(card);
    card.userData.dragging = false;
    card.userData.holdDrag = false;
    setCardGrab(false);
    canvas.style.cursor = "pointer";
    drag = null;
    if (!didDrag) {
      chooseCommunity(idx);
      return;
    }
    if (nearPickSlot(card.position)) {
      chooseCommunity(idx);
      return;
    }
    card.userData.free = true;
    card.userData.restY = 0.55;
  });
  canvas.addEventListener("pointercancel", () => {
    if (!drag) return;
    drag.userData.dragging = false;
    drag.userData.holdDrag = false;
    drag.userData.free = true;
    drag.userData.restY = 0.55;
    drag = null;
    setCardGrab(false);
  });
  canvas.style.cursor = "pointer";

  let userTouched = false;
  canvas.addEventListener(
    "pointerdown",
    () => {
      userTouched = true;
    },
    { capture: true }
  );

  function attractLift() {
    if (userTouched || picked || reduced) return;
    community.forEach((m, i) => {
      if (m.userData.rejected || m.userData.chosen || m.userData.dragging) return;
      const fan = (i - 1) * 0.16;
      const lift = gsap.timeline({ overwrite: "auto" });
      lift
        .to(m.position, { y: 0.92, duration: 0.3, delay: i * 0.07, ease: "power2.out" }, 0)
        .to(m.rotation, { z: fan, duration: 0.3, ease: "power2.out" }, 0)
        .to(m.position, { y: 0.55, duration: 0.36, ease: "power2.inOut" })
        .to(m.rotation, { z: 0, duration: 0.36, ease: "power2.inOut" }, "<");
    });
  }

  watchAttract(canvas, "d22-attract-badugi", attractLift);

  let clock = 0;
  const fit = () => fitRenderer(renderer, camera, canvas, 480, 300);
  fit();
  watchCanvasBox(canvas, fit);
  bindVisibleLoop(canvas, (first) => {
    if (first) fit();
    clock += 0.016;
    if (!reduced) {
      camera.position.x = Math.sin(clock * 0.2) * 0.1;
      camera.lookAt(0, 0.2, 0.15);
      label.lookAt(camera.position);
      triad.rotation.z = Math.PI / 6 + clock * 0.08;
      if (picked) {
        pickRing.rotation.z = clock * 0.6;
      }
      if (performance.now() > layoutUntil) {
        hole.forEach((m, i) => {
          if (m.userData.dragging) return;
          const restY = m.userData.restY ?? 0.5;
          m.position.y = restY + Math.sin(clock * 1.45 + (m.userData.phase || i)) * 0.022;
        });
        community.forEach((m, i) => {
          if (m.userData.dragging || m.userData.rejected) return;
          if (m.userData.free) {
            m.userData.restX += m.userData.vx;
            m.userData.restZ += m.userData.vz;
            m.userData.vx *= 0.88;
            m.userData.vz *= 0.88;
            const tmp = { x: m.userData.restX, z: m.userData.restZ };
            clampTable(tmp);
            m.userData.restX = tmp.x;
            m.userData.restZ = tmp.z;
            m.position.x = m.userData.restX;
            m.position.z = m.userData.restZ;
          }
          const restY = m.userData.restY ?? 0.55;
          m.position.y = restY + Math.sin(clock * 1.45 + (m.userData.phase || i)) * 0.026;
        });
      }
    }
    renderer.render(scene, camera);
  });
}

export { init2HH, initBadugi };
