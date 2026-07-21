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

function cardFaceTexture(rank, suit) {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 360;
  const ctx = c.getContext("2d");
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
  ctx.font = "700 54px Inter, system-ui, sans-serif";
  ctx.fillText(rank, 48, 52);
  ctx.font = "48px Inter, system-ui, sans-serif";
  ctx.fillText(suit, 48, 104);
  ctx.font = "120px Inter, system-ui, sans-serif";
  ctx.globalAlpha = 0.92;
  ctx.fillText(suit, 128, 190);
  ctx.globalAlpha = 1;
  ctx.save();
  ctx.translate(208, 308);
  ctx.rotate(Math.PI);
  ctx.font = "700 54px Inter, system-ui, sans-serif";
  ctx.fillText(rank, 0, 0);
  ctx.font = "48px Inter, system-ui, sans-serif";
  ctx.fillText(suit, 0, 52);
  ctx.restore();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function cardBackTexture(tint) {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 360;
  const ctx = c.getContext("2d");
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
  ctx.font = "700 36px JetBrains Mono, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("D22", 128, 180);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
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
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 96;
  const ctx = canvas.getContext("2d");
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
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
    ctx.font = "600 28px JetBrains Mono, monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 28, 48);
    tex.needsUpdate = true;
  };
  return mesh;
}

function makeZoneLabel(text, color) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = color;
  ctx.font = "700 28px JetBrains Mono, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.globalAlpha = 0.9;
  ctx.fillText(text, 128, 32);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
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
  camera.lookAt(0, 0.05, 0);

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
      new THREE.MeshBasicMaterial({
        color: race.accent,
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
      })
    );
    /* Fully behind body to avoid intersecting volumes / z-fight */
    frame.position.z = -0.22;
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
  label.position.set(0, -1.15, 0.2);
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
      const dist = 0.9 + Math.random() * 0.9;
      gsap.to(m.position, {
        x: Math.cos(a) * dist,
        y: Math.sin(a) * dist * 0.55,
        z: 0.5 + Math.random() * 0.4,
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
  renderer.setClearColor(0x0a1018, 1);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 40);
  camera.position.set(0, 5.6, 6.1);
  camera.lookAt(0, 0, 0);

  /* Terrain plate with subtle grid */
  const board = new THREE.Mesh(
    new THREE.PlaneGeometry(6.4, 4.6),
    new THREE.MeshBasicMaterial({ color: 0x142028 })
  );
  board.rotation.x = -Math.PI / 2;
  scene.add(board);

  const gridMat = new THREE.LineBasicMaterial({
    color: 0x2dd4bf,
    transparent: true,
    opacity: 0.12,
    depthWrite: false,
  });
  for (let i = -3; i <= 3; i++) {
    const gx = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(i * 0.9, 0.02, -2.1),
      new THREE.Vector3(i * 0.9, 0.02, 2.1),
    ]);
    const gz = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-2.7, 0.02, i * 0.6),
      new THREE.Vector3(2.7, 0.02, i * 0.6),
    ]);
    scene.add(new THREE.Line(gx, gridMat), new THREE.Line(gz, gridMat));
  }

  const fogPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(6.4, 1.7),
    new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    })
  );
  fogPlane.rotation.x = -Math.PI / 2;
  fogPlane.position.set(0, 0.05, -1.25);
  scene.add(fogPlane);

  /* Zerg-controlled haze on most of the map */
  const swarmHaze = new THREE.Mesh(
    new THREE.PlaneGeometry(5.2, 2.8),
    new THREE.MeshBasicMaterial({
      color: 0x4c1d95,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
    })
  );
  swarmHaze.rotation.x = -Math.PI / 2;
  swarmHaze.position.set(0, 0.08, -0.2);
  scene.add(swarmHaze);

  const bases = [
    { x: -1.9, z: -1.2, color: 0x22c55e },
    { x: 1.9, z: -1.2, color: 0x22c55e },
    { x: -1.9, z: 1.2, color: 0xfbbf24 },
    { x: 1.9, z: 1.2, color: 0x8b5cf6 },
  ];
  bases.forEach((b) => {
    const pad = new THREE.Mesh(
      new THREE.BoxGeometry(1.15, 0.07, 0.95),
      new THREE.MeshBasicMaterial({ color: b.color, transparent: true, opacity: 0.4 })
    );
    /* Lift pads so bottoms clear haze stack (half-height 0.035 → bottom ≈ 0.045) */
    pad.position.set(b.x, 0.08, b.z);
    scene.add(pad);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.55, 0.62, 24),
      new THREE.MeshBasicMaterial({
        color: b.color,
        transparent: true,
        opacity: 0.55,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(b.x, 0.14, b.z);
    scene.add(ring);
  });

  const center = new THREE.Mesh(
    new THREE.BoxGeometry(1.35, 0.06, 1.15),
    new THREE.MeshBasicMaterial({ color: 0x2dd4bf, transparent: true, opacity: 0.28 })
  );
  center.position.set(0, 0.08, 0);
  scene.add(center);

  const paths = [
    { from: [2.0, 1.4], to: [0.55, 0.15], color: 0xfbbf24, name: "REAVER / ARCHON" },
    { from: [-2.0, 1.4], to: [-0.4, 0.15], color: 0x2dd4bf, name: "DT / CORSAIR" },
    { from: [0, 1.85], to: [0, 0.35], color: 0x8b5cf6, name: "CENTER PUSH" },
  ];

  const trails = [];
  const prongs = paths.map((p) => {
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(p.from[0], 0.14, p.from[1]),
      new THREE.Vector3(p.from[0], 0.14, p.from[1]),
    ]);
    const line = new THREE.Line(
      lineGeo,
      new THREE.LineBasicMaterial({ color: p.color, transparent: true, opacity: 0.95 })
    );
    const tip = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 14, 14),
      new THREE.MeshBasicMaterial({ color: p.color })
    );
    tip.position.set(p.from[0], 0.16, p.from[1]);
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 12, 12),
      new THREE.MeshBasicMaterial({ color: p.color, transparent: true, opacity: 0.22 })
    );
    glow.position.copy(tip.position);
    scene.add(line, tip, glow);
    return { line, tip, glow, from: p.from, to: p.to, progress: { t: 0 }, color: p.color };
  });

  const captionCanvas = document.createElement("canvas");
  captionCanvas.width = 720;
  captionCanvas.height = 56;
  const cctx = captionCanvas.getContext("2d");
  function paintCaption(phase) {
    cctx.clearRect(0, 0, 720, 56);
    cctx.fillStyle = "rgba(8, 12, 18, 0.55)";
    cctx.fillRect(0, 0, 720, 56);
    cctx.fillStyle = "#d4af37";
    cctx.font = "600 17px JetBrains Mono, monospace";
    cctx.fillText("LOST TEMPLE // SEMI-FINAL // ~38:00 // vs GRRRR…", 14, 24);
    cctx.fillStyle = "#a78bfa";
    cctx.font = "500 13px JetBrains Mono, monospace";
    cctx.fillText(phase, 14, 44);
  }
  paintCaption("THREE-PRONG ASSAULT — STANDBY");
  const capTex = new THREE.CanvasTexture(captionCanvas);
  const cap = new THREE.Mesh(
    new THREE.PlaneGeometry(5.6, 0.42),
    new THREE.MeshBasicMaterial({ map: capTex, transparent: true })
  );
  cap.position.set(0, 0.28, 2.4);
  cap.rotation.x = -0.42;
  scene.add(cap);

  const isVisible = observeVisibility(canvas);
  let tl = null;
  let clock = 0;

  function spawnTrail(x, z, color) {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 8, 8),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.7 })
    );
    m.position.set(x, 0.12, z);
    m.userData.life = 1;
    scene.add(m);
    trails.push(m);
  }

  function playAssault() {
    if (tl) tl.kill();
    prongs.forEach((p) => {
      p.progress.t = 0;
    });
    paintCaption("THREE-PRONG ASSAULT — ENGAGE");
    capTex.needsUpdate = true;
    tl = gsap.timeline({
      repeat: reduced ? 0 : -1,
      repeatDelay: 1.1,
    });
    prongs.forEach((p, i) => {
      tl.to(
        p.progress,
        {
          t: 1,
          duration: reduced ? 0.01 : 2.35,
          ease: "power2.inOut",
          onUpdate: () => {
            const x = p.from[0] + (p.to[0] - p.from[0]) * p.progress.t;
            const z = p.from[1] + (p.to[1] - p.from[1]) * p.progress.t;
            p.tip.position.set(x, 0.16, z);
            p.glow.position.set(x, 0.16, z);
            const positions = p.line.geometry.attributes.position;
            positions.setXYZ(1, x, 0.14, z);
            positions.needsUpdate = true;
            if (!reduced && Math.random() > 0.72) spawnTrail(x, z, p.color);
          },
        },
        i * 0.18
      );
    });
    if (!reduced) {
      tl.add(() => {
        paintCaption("MAP BROKEN — ADVANCE TO FINALS");
        capTex.needsUpdate = true;
      });
      tl.to({}, { duration: 1.15 });
      tl.add(() => {
        paintCaption("THREE-PRONG ASSAULT — STANDBY");
        capTex.needsUpdate = true;
        prongs.forEach((p) => {
          p.progress.t = 0;
          const positions = p.line.geometry.attributes.position;
          positions.setXYZ(1, p.from[0], 0.14, p.from[1]);
          positions.needsUpdate = true;
          p.tip.position.set(p.from[0], 0.16, p.from[1]);
          p.glow.position.copy(p.tip.position);
        });
      });
    }
  }
  playAssault();

  function loop() {
    fitRenderer(renderer, camera, canvas, 480, 300);
    clock += 0.016;
    if (isVisible()) {
      if (tl && tl.paused()) tl.resume();
      /* Soft camera orbit for presence */
      if (!reduced) {
        camera.position.x = Math.sin(clock * 0.18) * 0.35;
        camera.lookAt(0, 0, 0);
      }
      for (let i = trails.length - 1; i >= 0; i--) {
        const t = trails[i];
        t.userData.life -= 0.035;
        t.material.opacity = Math.max(0, t.userData.life * 0.7);
        t.scale.setScalar(0.6 + t.userData.life * 0.8);
        if (t.userData.life <= 0) {
          scene.remove(t);
          t.geometry.dispose();
          t.material.dispose();
          trails.splice(i, 1);
        }
      }
      fogPlane.material.opacity = 0.42 + Math.sin(clock * 0.7) * 0.06;
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

  function disposeCards(list) {
    list.forEach((m) => {
      scene.remove(m);
      m.userData.dispose?.();
    });
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
      m.position.set(-0.9 + i * 0.22, 1.1, 2.4);
      m.rotation.set(-0.4, 0, 0);
      m.scale.setScalar(0.85);
      scene.add(m);
    });
    board.forEach((m, i) => {
      m.position.set(-0.4 + i * 0.2, 1.2, -1.6);
      m.rotation.set(-0.5, 0, 0);
      m.scale.setScalar(0.85);
      scene.add(m);
    });
  }

  function layout(animate) {
    const duration = reduced || !animate ? 0.01 : 0.65;
    const ease = "power3.out";
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
      gsap.to(m.position, {
        x,
        y: 0.52,
        z,
        duration,
        delay: reduced ? 0 : i * 0.04,
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
      gsap.to(m.scale, { x: 1, y: 1, z: 1, duration, ease, overwrite: "auto" });
    });
    board.forEach((m, i) => {
      gsap.to(m.position, {
        x: -0.85 + i * 0.85,
        y: 0.52,
        z: -0.55,
        duration,
        delay: reduced ? 0 : 0.12 + i * 0.05,
        ease,
        overwrite: "auto",
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
  layout(true);

  canvas.addEventListener("click", () => {
    if (busy) return;
    if (split) {
      busy = true;
      split = false;
      dealFresh();
      label.userData.paint("DEALT — CLICK TO SPLIT INTO TWO HANDS");
      layout(true);
      window.setTimeout(() => {
        busy = false;
      }, reduced ? 40 : 700);
      return;
    }
    split = true;
    label.userData.paint("TWO HANDS // ONE BOARD — CLICK TO REDEAL");
    layout(true);
  });
  canvas.style.cursor = "pointer";

  const isVisible = observeVisibility(canvas);
  let clock = 0;
  function loop() {
    fitRenderer(renderer, camera, canvas, 480, 300);
    clock += 0.016;
    if (isVisible()) {
      if (!reduced) {
        camera.position.x = Math.sin(clock * 0.22) * 0.12;
        camera.position.y = 4.1 + Math.sin(clock * 0.18) * 0.04;
        camera.lookAt(0, 0.15, 0.1);
        label.lookAt(camera.position);
      }
      renderer.render(scene, camera);
    }
    requestAnimationFrame(loop);
  }
  loop();
}

/* ---------- BADUGI TRIAD ---------- */
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

  function disposeCards(list) {
    list.forEach((m) => {
      scene.remove(m);
      m.userData.dispose?.();
    });
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

    hole.forEach((m, i) => {
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

  canvas.addEventListener("pointermove", (e) => {
    if (picked || reduced) return;
    const idx = resolveIndex(e);
    if (idx === hoverIdx) return;
    hoverIdx = idx;
    canvas.style.cursor = idx >= 0 ? "pointer" : "default";
    community.forEach((m, i) => {
      if (m.userData.rejected || m.userData.chosen) return;
      gsap.to(m.position, {
        y: i === hoverIdx ? 0.72 : 0.55,
        duration: 0.22,
        ease: "power2.out",
        overwrite: "auto",
      });
    });
  });

  canvas.addEventListener("click", (e) => {
    if (picked) {
      picked = false;
      hoverIdx = -1;
      makeDeal();
      label.userData.paint("PICK 1 OF 3 COMMUNITY CARDS");
      communityTag.material.opacity = 0.75;
      layout(true);
      return;
    }
    const idx = resolveIndex(e);
    if (idx < 0) return;
    community.forEach((m, i) => {
      m.userData.chosen = i === idx;
      m.userData.rejected = i !== idx;
    });
    picked = true;
    hoverIdx = -1;
    label.userData.paint("HAND COMPLETE — CLICK TO RESET");
    communityTag.material.opacity = 0.35;
    layout(true);
  });
  canvas.style.cursor = "pointer";

  const isVisible = observeVisibility(canvas);
  let clock = 0;
  function loop() {
    fitRenderer(renderer, camera, canvas, 480, 300);
    clock += 0.016;
    if (isVisible()) {
      if (!reduced) {
        camera.position.x = Math.sin(clock * 0.2) * 0.1;
        camera.lookAt(0, 0.2, 0.15);
        label.lookAt(camera.position);
        triad.rotation.z = Math.PI / 6 + clock * 0.08;
        if (picked) {
          pickRing.rotation.z = clock * 0.6;
        }
      }
      renderer.render(scene, camera);
    }
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
