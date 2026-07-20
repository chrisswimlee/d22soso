/* Panel WebGL scenes: race roll, Lost Temple battle, 2HH + Badugi cards */
import * as THREE from "three";
import gsap from "gsap";

const reduced =
  typeof matchMedia !== "undefined" &&
  matchMedia("(prefers-reduced-motion: reduce)").matches;

function makeRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: false,
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setClearColor(0x08080c, 1);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  return renderer;
}

function fitRenderer(renderer, camera, canvas, fallbackW, fallbackH) {
  const cssW = canvas.clientWidth || fallbackW;
  const cssH = canvas.clientHeight || fallbackH;
  renderer.setSize(cssW, cssH, false);
  camera.aspect = cssW / Math.max(1, cssH);
  camera.updateProjectionMatrix();
  return { w: cssW, h: cssH };
}

function cardTexture(rank, suit) {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 180;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#f8f5ef";
  ctx.fillRect(0, 0, 128, 180);
  ctx.strokeStyle = "#222";
  ctx.lineWidth = 4;
  ctx.strokeRect(3, 3, 122, 174);
  const red = suit === "♥" || suit === "♦";
  ctx.fillStyle = red ? "#b91c1c" : "#111";
  ctx.font = "bold 42px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(rank + suit, 64, 90);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeCardMesh(rank, suit) {
  const geo = new THREE.BoxGeometry(0.7, 1.0, 0.04);
  const face = new THREE.MeshBasicMaterial({ map: cardTexture(rank, suit) });
  const back = new THREE.MeshBasicMaterial({ color: 0x1e293b });
  const edge = new THREE.MeshBasicMaterial({ color: 0xd4d0c8 });
  const mesh = new THREE.Mesh(geo, [edge, edge, edge, edge, face, back]);
  return mesh;
}

function observeVisibility(canvas, onChange) {
  let visible = true;
  if ("IntersectionObserver" in window) {
    const obs = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      onChange?.(visible);
    });
    obs.observe(canvas);
  }
  return () => visible;
}

/* ---------- RANDOM RACE ROLL ---------- */
function initRaceRoll(canvas) {
  if (!canvas) return { roll: () => {} };

  const races = [
    { name: "TERRAN", color: 0x9ca3af, accent: 0xef4444 },
    { name: "ZERG", color: 0xa78bfa, accent: 0x22c55e },
    { name: "PROTOSS", color: 0xfbbf24, accent: 0x2dd4bf },
  ];

  const renderer = makeRenderer(canvas);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 40);
  camera.position.set(0, 0.2, 5.2);

  const ambient = new THREE.AmbientLight(0xffffff, 0.9);
  scene.add(ambient);

  const pillars = races.map((race, i) => {
    const group = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.15, 0.9, 0.35),
      new THREE.MeshBasicMaterial({ color: race.color })
    );
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(1.22, 0.96, 0.28),
      new THREE.MeshBasicMaterial({ color: race.accent, transparent: true, opacity: 0.35 })
    );
    frame.position.z = -0.05;
    group.add(frame, body);
    group.position.set((i - 1) * 1.55, 0.15, 0);
    group.userData.race = race;
    group.userData.body = body;
    group.userData.frame = frame;
    scene.add(group);
    return group;
  });

  /* Label sprite via canvas texture on a plane under pillars */
  const labelCanvas = document.createElement("canvas");
  labelCanvas.width = 512;
  labelCanvas.height = 64;
  const labelCtx = labelCanvas.getContext("2d");
  const labelTex = new THREE.CanvasTexture(labelCanvas);
  const labelMat = new THREE.MeshBasicMaterial({
    map: labelTex,
    transparent: true,
    depthWrite: false,
  });
  const label = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 0.45), labelMat);
  label.position.set(0, -1.35, 0.2);
  scene.add(label);

  function setLabel(text) {
    labelCtx.clearRect(0, 0, 512, 64);
    labelCtx.fillStyle = "#d4af37";
    labelCtx.font = "600 22px JetBrains Mono, monospace";
    labelCtx.textAlign = "center";
    labelCtx.textBaseline = "middle";
    labelCtx.fillText(text, 256, 32);
    labelTex.needsUpdate = true;
  }
  setLabel("CLICK OR PRESS R TO ROLL");

  const particles = new THREE.Group();
  scene.add(particles);

  let spinning = false;
  let settled = false;
  let spinProxy = { t: 0 };
  let spinTween = null;
  const isVisible = observeVisibility(canvas);

  function setActiveIndex(idx, showAll) {
    pillars.forEach((p, i) => {
      const on = showAll || i === idx;
      gsap.to(p.scale, {
        x: on ? 1 : 0.78,
        y: on ? 1 : 0.78,
        z: on ? 1 : 0.78,
        duration: 0.2,
        overwrite: "auto",
      });
      gsap.to(p.userData.frame.material, {
        opacity: on ? 0.85 : 0.2,
        duration: 0.2,
        overwrite: "auto",
      });
      gsap.to(p.position, {
        y: on ? 0.25 : 0.05,
        duration: 0.2,
        overwrite: "auto",
      });
    });
  }

  function burst() {
    for (let i = 0; i < 28; i++) {
      const m = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.06, 0.06),
        new THREE.MeshBasicMaterial({
          color: i % 2 ? 0x8b5cf6 : 0xd4af37,
          transparent: true,
          opacity: 1,
        })
      );
      m.position.set(0, 0.2, 0.5);
      particles.add(m);
      const a = (Math.PI * 2 * i) / 28;
      const dist = 1.2 + Math.random() * 1.4;
      gsap.to(m.position, {
        x: Math.cos(a) * dist,
        y: Math.sin(a) * dist * 0.6,
        z: 0.5 + Math.random(),
        duration: 0.7 + Math.random() * 0.35,
        ease: "power2.out",
      });
      gsap.to(m.material, {
        opacity: 0,
        duration: 0.75,
        delay: 0.15,
        onComplete: () => {
          particles.remove(m);
          m.geometry.dispose();
          m.material.dispose();
        },
      });
    }
  }

  function roll() {
    if (spinning) return;
    if (reduced) {
      settled = true;
      setActiveIndex(0, true);
      setLabel("RANDOM — ALL RACES, ONE MIND");
      document.body.dataset.race = "random";
      return;
    }
    spinning = true;
    settled = false;
    particles.clear();
    setLabel("ROLLING…");
    spinProxy.t = 0;
    if (spinTween) spinTween.kill();
    const duration = 1.6 + Math.random() * 0.6;
    spinTween = gsap.to(spinProxy, {
      t: 18 + Math.random() * 10,
      duration,
      ease: "power3.out",
      onUpdate: () => {
        const idx = Math.floor(spinProxy.t) % 3;
        setActiveIndex(idx, false);
      },
      onComplete: () => {
        spinning = false;
        settled = true;
        setActiveIndex(0, true);
        setLabel("RANDOM — ALL RACES, ONE MIND");
        document.body.dataset.race = "random";
        burst();
      },
    });
  }

  canvas.addEventListener("click", roll);
  canvas.style.cursor = "pointer";

  let raf = 0;
  function loop() {
    fitRenderer(renderer, camera, canvas, 420, 280);
    if (isVisible()) renderer.render(scene, camera);
    raf = requestAnimationFrame(loop);
  }
  loop();

  window.addEventListener("resize", () => fitRenderer(renderer, camera, canvas, 420, 280));

  return { roll };
}

/* ---------- LOST TEMPLE BATTLE MAP ---------- */
function initBattleMap(canvas) {
  if (!canvas) return;

  const renderer = makeRenderer(canvas);
  renderer.setClearColor(0x101418, 1);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 40);
  camera.position.set(0, 5.2, 5.8);
  camera.lookAt(0, 0, 0);

  const board = new THREE.Mesh(
    new THREE.PlaneGeometry(6.2, 4.4),
    new THREE.MeshBasicMaterial({ color: 0x152028 })
  );
  board.rotation.x = -Math.PI / 2;
  scene.add(board);

  const fogPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(6.2, 1.6),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45 })
  );
  fogPlane.rotation.x = -Math.PI / 2;
  fogPlane.position.set(0, 0.02, -1.2);
  scene.add(fogPlane);

  const bases = [
    [-1.9, -1.2],
    [1.9, -1.2],
    [-1.9, 1.2],
    [1.9, 1.2],
  ];
  bases.forEach(([x, z]) => {
    const pad = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.06, 1.0),
      new THREE.MeshBasicMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0.35 })
    );
    pad.position.set(x, 0.04, z);
    scene.add(pad);
  });

  const center = new THREE.Mesh(
    new THREE.BoxGeometry(1.3, 0.05, 1.1),
    new THREE.MeshBasicMaterial({ color: 0x2dd4bf, transparent: true, opacity: 0.25 })
  );
  center.position.set(0, 0.04, 0);
  scene.add(center);

  const paths = [
    { from: [2.0, 1.4], to: [0.55, 0.15], color: 0xfbbf24 },
    { from: [-2.0, 1.4], to: [-0.4, 0.15], color: 0x2dd4bf },
    { from: [0, 1.85], to: [0, 0.35], color: 0x8b5cf6 },
  ];

  const prongs = paths.map((p) => {
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(p.from[0], 0.12, p.from[1]),
      new THREE.Vector3(p.from[0], 0.12, p.from[1]),
    ]);
    const line = new THREE.Line(
      lineGeo,
      new THREE.LineBasicMaterial({ color: p.color, transparent: true, opacity: 0.9 })
    );
    const tip = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 12, 12),
      new THREE.MeshBasicMaterial({ color: p.color })
    );
    tip.position.set(p.from[0], 0.14, p.from[1]);
    scene.add(line, tip);
    return { line, tip, from: p.from, to: p.to, progress: { t: 0 } };
  });

  const captionCanvas = document.createElement("canvas");
  captionCanvas.width = 640;
  captionCanvas.height = 48;
  const cctx = captionCanvas.getContext("2d");
  cctx.fillStyle = "#d4af37";
  cctx.font = "600 18px JetBrains Mono, monospace";
  cctx.fillText("LOST TEMPLE // SEMI-FINAL // ~38:00 // vs GRRRR…", 12, 30);
  const capTex = new THREE.CanvasTexture(captionCanvas);
  const cap = new THREE.Mesh(
    new THREE.PlaneGeometry(5.4, 0.35),
    new THREE.MeshBasicMaterial({ map: capTex, transparent: true })
  );
  cap.position.set(0, 0.2, 2.35);
  cap.rotation.x = -0.4;
  scene.add(cap);

  const isVisible = observeVisibility(canvas);
  let tl = null;

  function playAssault() {
    if (tl) tl.kill();
    prongs.forEach((p) => {
      p.progress.t = 0;
    });
    tl = gsap.timeline({
      repeat: reduced ? 0 : -1,
      repeatDelay: 1.2,
    });
    prongs.forEach((p, i) => {
      tl.to(
        p.progress,
        {
          t: 1,
          duration: reduced ? 0.01 : 2.4,
          ease: "power2.inOut",
          onUpdate: () => {
            const x = p.from[0] + (p.to[0] - p.from[0]) * p.progress.t;
            const z = p.from[1] + (p.to[1] - p.from[1]) * p.progress.t;
            p.tip.position.set(x, 0.14, z);
            const positions = p.line.geometry.attributes.position;
            positions.setXYZ(1, x, 0.12, z);
            positions.needsUpdate = true;
          },
        },
        i * 0.15
      );
    });
    if (!reduced) {
      tl.to({}, { duration: 1.2 });
      tl.add(() => {
        prongs.forEach((p) => {
          p.progress.t = 0;
          const positions = p.line.geometry.attributes.position;
          positions.setXYZ(1, p.from[0], 0.12, p.from[1]);
          positions.needsUpdate = true;
          p.tip.position.set(p.from[0], 0.14, p.from[1]);
        });
      });
    }
  }
  playAssault();

  function loop() {
    fitRenderer(renderer, camera, canvas, 480, 300);
    if (isVisible()) {
      if (tl && tl.paused()) tl.resume();
      renderer.render(scene, camera);
    } else if (tl && !tl.paused()) {
      tl.pause();
    }
    requestAnimationFrame(loop);
  }
  loop();
}

/* ---------- 2 HAND HOLD'EM ---------- */
function init2HH(canvas) {
  if (!canvas) return;

  const suits = ["♠", "♥", "♦", "♣"];
  const ranks = ["A", "K", "Q", "J", "T", "9"];
  const pick = () => ({
    rank: ranks[(Math.random() * ranks.length) | 0],
    suit: suits[(Math.random() * suits.length) | 0],
  });

  const renderer = makeRenderer(canvas);
  renderer.setClearColor(0x0a1a12, 1);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 40);
  camera.position.set(0, 3.8, 5.2);
  camera.lookAt(0, 0.2, 0);

  const table = new THREE.Mesh(
    new THREE.CircleGeometry(3.2, 48),
    new THREE.MeshBasicMaterial({ color: 0x0d2818 })
  );
  table.rotation.x = -Math.PI / 2;
  scene.add(table);

  let hole = [pick(), pick(), pick(), pick()].map((c) => makeCardMesh(c.rank, c.suit));
  let board = [pick(), pick(), pick()].map((c) => makeCardMesh(c.rank, c.suit));
  hole.forEach((m) => scene.add(m));
  board.forEach((m) => scene.add(m));

  const handBoxes = [
    new THREE.Mesh(
      new THREE.PlaneGeometry(2.2, 1.6),
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
      })
    ),
    new THREE.Mesh(
      new THREE.PlaneGeometry(2.2, 1.6),
      new THREE.MeshBasicMaterial({
        color: 0xfb7185,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
      })
    ),
  ];
  handBoxes[0].rotation.x = -Math.PI / 2;
  handBoxes[1].rotation.x = -Math.PI / 2;
  handBoxes[0].position.set(-1.35, 0.02, 1.1);
  handBoxes[1].position.set(1.35, 0.02, 1.1);
  scene.add(...handBoxes);

  const labelCanvas = document.createElement("canvas");
  labelCanvas.width = 512;
  labelCanvas.height = 48;
  const lctx = labelCanvas.getContext("2d");
  const ltex = new THREE.CanvasTexture(labelCanvas);
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(4.2, 0.35),
    new THREE.MeshBasicMaterial({ map: ltex, transparent: true })
  );
  label.position.set(0, 0.05, -2.2);
  label.rotation.x = -Math.PI / 2;
  scene.add(label);

  function setLabel(text) {
    lctx.clearRect(0, 0, 512, 48);
    lctx.fillStyle = "rgba(212,175,55,0.9)";
    lctx.font = "600 18px JetBrains Mono, monospace";
    lctx.fillText(text, 16, 30);
    ltex.needsUpdate = true;
  }
  setLabel("DEALT — CLICK TO SPLIT");

  let split = false;

  function layout(animate) {
    const duration = reduced || !animate ? 0.01 : 0.55;
    const ease = "power3.out";
    hole.forEach((m, i) => {
      let x;
      let z;
      if (!split) {
        x = -1.35 + i * 0.9;
        z = 1.15;
      } else {
        const hand = i < 2 ? 0 : 1;
        x = (hand === 0 ? -1.7 : 1.0) + (i % 2) * 0.75;
        z = 1.15;
      }
      gsap.to(m.position, { x, y: 0.08, z, duration, ease, overwrite: "auto" });
      gsap.to(m.rotation, { x: -0.15, y: 0, z: 0, duration, ease, overwrite: "auto" });
    });
    board.forEach((m, i) => {
      gsap.to(m.position, {
        x: -0.9 + i * 0.9,
        y: 0.08,
        z: -0.6,
        duration,
        ease,
        overwrite: "auto",
      });
      gsap.to(m.rotation, { x: -0.15, y: 0, z: 0, duration, ease, overwrite: "auto" });
    });
    handBoxes.forEach((b, i) => {
      gsap.to(b.material, {
        opacity: split ? 0.18 : 0,
        duration,
        overwrite: "auto",
      });
    });
  }

  hole.forEach((m, i) => m.position.set(-1.2 + i * 0.3, 1.5, 2));
  board.forEach((m, i) => m.position.set(-0.5 + i * 0.3, 1.5, -1));
  layout(true);

  function redeal() {
    hole.forEach((m) => {
      scene.remove(m);
      m.geometry.dispose();
    });
    board.forEach((m) => {
      scene.remove(m);
      m.geometry.dispose();
    });
    hole = [pick(), pick(), pick(), pick()].map((c) => makeCardMesh(c.rank, c.suit));
    board = [pick(), pick(), pick()].map((c) => makeCardMesh(c.rank, c.suit));
    hole.forEach((m, i) => {
      m.position.set(-1.2 + i * 0.3, 1.5, 2);
      scene.add(m);
    });
    board.forEach((m, i) => {
      m.position.set(-0.5 + i * 0.3, 1.5, -1);
      scene.add(m);
    });
  }

  canvas.addEventListener("click", () => {
    if (split) {
      split = false;
      redeal();
      setLabel("DEALT — CLICK TO SPLIT");
    } else {
      split = true;
      setLabel("TWO HANDS // ONE BOARD");
    }
    layout(true);
  });
  canvas.style.cursor = "pointer";

  const isVisible = observeVisibility(canvas);
  function loop() {
    fitRenderer(renderer, camera, canvas, 480, 300);
    if (isVisible()) renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }
  loop();
}

/* ---------- BADUGI TRIAD ---------- */
function initBadugi(canvas) {
  if (!canvas) return;

  const suits = ["♠", "♥", "♦", "♣"];
  const ranks = ["A", "2", "3", "4", "5"];

  const renderer = makeRenderer(canvas);
  renderer.setClearColor(0x0a1018, 1);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 40);
  camera.position.set(0, 3.6, 5);
  camera.lookAt(0, 0.2, 0);

  const table = new THREE.Mesh(
    new THREE.CircleGeometry(3.0, 48),
    new THREE.MeshBasicMaterial({ color: 0x0f172a })
  );
  table.rotation.x = -Math.PI / 2;
  scene.add(table);

  function makeCommunity() {
    return [0, 1, 2].map((i) => {
      const mesh = makeCardMesh(ranks[i % ranks.length], suits[i % 4]);
      mesh.userData.idx = i;
      mesh.userData.chosen = false;
      mesh.userData.rejected = false;
      scene.add(mesh);
      return mesh;
    });
  }

  let community = makeCommunity();
  let picked = false;

  const labelCanvas = document.createElement("canvas");
  labelCanvas.width = 512;
  labelCanvas.height = 48;
  const lctx = labelCanvas.getContext("2d");
  const ltex = new THREE.CanvasTexture(labelCanvas);
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(4.2, 0.35),
    new THREE.MeshBasicMaterial({ map: ltex, transparent: true })
  );
  label.position.set(0, 0.05, -2.0);
  label.rotation.x = -Math.PI / 2;
  scene.add(label);

  function setLabel(text) {
    lctx.clearRect(0, 0, 512, 48);
    lctx.fillStyle = "#94a3b8";
    lctx.font = "600 18px JetBrains Mono, monospace";
    lctx.fillText(text, 16, 30);
    ltex.needsUpdate = true;
  }
  setLabel("PICK 1 OF 3 COMMUNITY CARDS");

  function layout(animate) {
    const duration = reduced || !animate ? 0.01 : 0.5;
    community.forEach((m, i) => {
      let x;
      let z;
      let y = 0.08;
      let opacity = 1;
      if (m.userData.chosen) {
        x = 0;
        z = 1.3;
      } else if (m.userData.rejected) {
        x = -1.4 + i * 1.4;
        z = 2.8;
        y = -0.5;
        opacity = 0;
      } else {
        x = -1.4 + i * 1.4;
        z = 0.2;
      }
      gsap.to(m.position, { x, y, z, duration, ease: "power3.out", overwrite: "auto" });
      gsap.to(m.rotation, {
        x: -0.2,
        y: m.userData.chosen ? 0.15 : 0,
        z: 0,
        duration,
        ease: "power3.out",
        overwrite: "auto",
      });
      m.traverse?.(() => {});
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      mats.forEach((mat) => {
        mat.transparent = true;
        gsap.to(mat, { opacity, duration, overwrite: "auto" });
      });
    });
  }

  community.forEach((m, i) => m.position.set(-1 + i * 0.5, 1.4, 1.5));
  layout(true);

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  canvas.addEventListener("click", (e) => {
    if (picked) {
      community.forEach((m) => {
        scene.remove(m);
        m.geometry.dispose();
      });
      community = makeCommunity();
      community.forEach((m, i) => m.position.set(-1 + i * 0.5, 1.4, 1.5));
      picked = false;
      setLabel("PICK 1 OF 3 COMMUNITY CARDS");
      layout(true);
      return;
    }
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(community, false);
    let idx = -1;
    if (hits.length) {
      idx = community.indexOf(hits[0].object);
    } else {
      /* fallback: nearest by x in NDC-ish screen space */
      const x = (e.clientX - rect.left) / rect.width;
      let best = 0;
      let bestD = Infinity;
      community.forEach((m, i) => {
        const d = Math.abs((i + 0.5) / 3 - x);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      idx = best;
    }
    if (idx < 0) return;
    community.forEach((m, i) => {
      m.userData.chosen = i === idx;
      m.userData.rejected = i !== idx;
    });
    picked = true;
    setLabel("HAND COMPLETE — CLICK TO RESET");
    layout(true);
  });
  canvas.style.cursor = "pointer";

  const isVisible = observeVisibility(canvas);
  function loop() {
    fitRenderer(renderer, camera, canvas, 480, 300);
    if (isVisible()) renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }
  loop();
}

/* Compatibility shim — same surface as legacy D22Canvas */
export const D22Canvas = {
  initFog() {
    /* fog handled by webgl-scene */
  },
  initMinimap() {},
  initRaceRoll,
  initBattleMap,
  init2HH,
  initBadugi,
};

export { initRaceRoll, initBattleMap, init2HH, initBadugi };
