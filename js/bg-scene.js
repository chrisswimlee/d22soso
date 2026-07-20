/* Themed 3D icon fleets for #bg-stage
 * - Vanilla JS: IntersectionObserver + requestAnimationFrame (no GSAP dep)
 * - Each theme layer receives a fleet of inline SVG icons positioned in 3D
 * - Idle: gentle drift/rotate keyframes (CSS)
 * - Scroll: JS updates `--p` on the active layer (0..1) to drive translateZ/scale/rotate
 */
(function () {
  "use strict";

  const stage = document.getElementById("bg-stage");
  if (!stage) return;

  const reduced =
    (window.D22Physics && window.D22Physics.reduced) ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --------- Inline SVG icon library --------- */
  const svg = (body, w = 100, h = 100) =>
    `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

  const ICONS = {
    /* StarCraft: Protoss triangle sigil, Zerg claw, Terran cross command */
    protoss: svg(
      `<path d="M50 8 L92 82 L8 82 Z" />
       <path d="M50 30 L74 74 L26 74 Z" />
       <circle cx="50" cy="60" r="4" fill="currentColor"/>`
    ),
    zerg: svg(
      `<path d="M20 80 C10 40 40 10 50 30 C60 10 90 40 80 80 C60 60 40 60 20 80 Z" />
       <path d="M50 30 L50 60" />
       <circle cx="50" cy="55" r="3" fill="currentColor"/>`
    ),
    terran: svg(
      `<rect x="18" y="18" width="64" height="64" rx="4" />
       <path d="M50 18 V82 M18 50 H82" />
       <circle cx="50" cy="50" r="8" />`
    ),
    starDot: svg(`<circle cx="50" cy="50" r="4" fill="currentColor"/>`),

    /* C&C: GDI eagle-ish + Nod scorpion silhouettes simplified */
    gdi: svg(
      `<path d="M50 12 L70 30 L82 26 L74 42 L88 52 L74 58 L82 74 L70 70 L50 88 L30 70 L18 74 L26 58 L12 52 L26 42 L18 26 L30 30 Z" />`
    ),
    nod: svg(
      `<path d="M50 12 C74 20 80 44 66 60 C80 66 76 82 60 84 C58 74 50 70 44 78 C36 66 46 58 34 52 C22 46 26 28 40 24 C42 32 50 34 50 12 Z" />`
    ),
    reticle: svg(
      `<circle cx="50" cy="50" r="36" />
       <path d="M50 6 V26 M50 74 V94 M6 50 H26 M74 50 H94" />
       <circle cx="50" cy="50" r="6" />`
    ),

    /* Warcraft: crossed swords + rune shield */
    swords: svg(
      `<path d="M18 18 L58 58 L64 52 L74 62 L62 74 L52 64 L46 70 L58 82 L52 88 L18 54 Z" />
       <path d="M82 18 L42 58 L36 52 L26 62 L38 74 L48 64 L54 70 L42 82 L48 88 L82 54 Z" />`
    ),
    shield: svg(
      `<path d="M50 10 L86 22 V50 C86 74 68 88 50 92 C32 88 14 74 14 50 V22 Z" />
       <path d="M50 30 V72 M32 46 L68 46" />`
    ),
    banner: svg(
      `<path d="M20 12 H80 V70 L50 88 L20 70 Z" />
       <path d="M35 24 H65 M35 36 H65" />`
    ),

    /* Magic: card silhouette + mana pip */
    card: svg(
      `<rect x="20" y="10" width="60" height="80" rx="4" />
       <circle cx="50" cy="30" r="8" />
       <path d="M30 50 H70 M30 62 H70 M30 74 H60" />`
    ),
    manaPip: svg(
      `<circle cx="50" cy="50" r="32" />
       <path d="M42 50 L50 42 L58 50 L50 58 Z" />`
    ),

    /* Hearthstone: mana crystal (diamond) + rope timer knot */
    manaCrystal: svg(
      `<path d="M50 8 L82 40 L50 92 L18 40 Z" />
       <path d="M50 8 L50 92 M18 40 L82 40 M32 24 L68 24" />`
    ),
    rune: svg(
      `<circle cx="50" cy="50" r="36" />
       <path d="M50 20 L50 80 M28 34 L72 66 M28 66 L72 34" />`
    ),

    /* Poker: card face (Ace) + chip disc */
    cardFace: svg(
      `<rect x="18" y="10" width="64" height="80" rx="6" />
       <path d="M50 26 L38 50 L62 50 Z" />
       <path d="M32 74 H68" />`
    ),
    chip: svg(
      `<circle cx="50" cy="50" r="38" />
       <circle cx="50" cy="50" r="26" />
       <path d="M50 12 V22 M50 78 V88 M12 50 H22 M78 50 H88" />`
    ),
    suitSpade: svg(
      `<path d="M50 12 C68 34 84 44 76 62 C72 74 60 74 54 66 L56 82 H44 L46 66 C40 74 28 74 24 62 C16 44 32 34 50 12 Z" />`
    ),
    suitHeart: svg(
      `<path d="M50 84 C24 66 12 50 20 34 C26 22 42 22 50 34 C58 22 74 22 80 34 C88 50 76 66 50 84 Z" />`
    ),

    /* 2 Hand Hold'em: two overlapping cards */
    twoCards: svg(
      `<rect x="14" y="18" width="46" height="66" rx="4" transform="rotate(-8 37 51)" />
       <rect x="42" y="18" width="46" height="66" rx="4" transform="rotate(8 65 51)" />`
    ),

    /* Badugi: card triad */
    triad: svg(
      `<rect x="10" y="30" width="28" height="42" rx="3" transform="rotate(-10 24 51)" />
       <rect x="36" y="18" width="28" height="42" rx="3" />
       <rect x="62" y="30" width="28" height="42" rx="3" transform="rotate(10 76 51)" />`
    ),

    /* Contact: signal envelope */
    signal: svg(
      `<rect x="12" y="24" width="76" height="52" rx="4" />
       <path d="M12 28 L50 58 L88 28" />
       <path d="M12 76 L38 54 M88 76 L62 54" />`
    ),
  };

  /* --------- Fleet spec per theme ---------
   * Each item: { icon, x%, y%, size(px), z(0..1 depth), rot(deg), tint, drift(sec) }
   * `z` roughly maps to a depth plane: 0 = far (small, faded), 1 = near
   */
  const FLEETS = {
    starcraft: [
      { i: "protoss", x: 12, y: 22, s: 260, z: 0.85, r: -8, c: "#a78bfa", d: 22 },
      { i: "zerg", x: 82, y: 68, s: 220, z: 0.7, r: 12, c: "#2dd4bf", d: 26 },
      { i: "terran", x: 78, y: 18, s: 130, z: 0.5, r: 6, c: "#d4af37", d: 18 },
      { i: "starDot", x: 40, y: 80, s: 60, z: 0.3, r: 0, c: "#fff", d: 12 },
      { i: "starDot", x: 20, y: 55, s: 40, z: 0.2, r: 0, c: "#fff", d: 14 },
      { i: "starDot", x: 66, y: 40, s: 30, z: 0.15, r: 0, c: "#fff", d: 10 },
      { i: "reticle", x: 55, y: 75, s: 180, z: 0.6, r: 0, c: "#8b5cf6", d: 30 },
    ],
    about: [
      { i: "protoss", x: 8, y: 15, s: 200, z: 0.6, r: -12, c: "#8b5cf6", d: 24 },
      { i: "manaCrystal", x: 85, y: 70, s: 180, z: 0.5, r: 8, c: "#d4af37", d: 28 },
      { i: "starDot", x: 45, y: 40, s: 30, z: 0.2, r: 0, c: "#fff", d: 14 },
      { i: "starDot", x: 70, y: 22, s: 24, z: 0.15, r: 0, c: "#fff", d: 12 },
      { i: "reticle", x: 25, y: 78, s: 140, z: 0.45, r: 0, c: "#a78bfa", d: 32 },
    ],
    cnc: [
      { i: "gdi", x: 18, y: 22, s: 240, z: 0.85, r: -6, c: "#39ff14", d: 24 },
      { i: "nod", x: 82, y: 74, s: 230, z: 0.75, r: 8, c: "#e11d48", d: 26 },
      { i: "reticle", x: 60, y: 30, s: 160, z: 0.55, r: 0, c: "#39ff14", d: 20 },
      { i: "reticle", x: 30, y: 72, s: 110, z: 0.35, r: 0, c: "#c4a35a", d: 18 },
    ],
    warcraft: [
      { i: "swords", x: 78, y: 25, s: 260, z: 0.85, r: 8, c: "#fbbf24", d: 22 },
      { i: "shield", x: 16, y: 68, s: 240, z: 0.8, r: -6, c: "#60a5fa", d: 26 },
      { i: "banner", x: 55, y: 78, s: 180, z: 0.5, r: 0, c: "#fbbf24", d: 20 },
      { i: "shield", x: 62, y: 22, s: 120, z: 0.35, r: 0, c: "#c48b3b", d: 18 },
    ],
    mtg: [
      { i: "card", x: 14, y: 22, s: 240, z: 0.85, r: -10, c: "#a78bfa", d: 24 },
      { i: "card", x: 82, y: 70, s: 220, z: 0.75, r: 8, c: "#fcd34d", d: 26 },
      { i: "manaPip", x: 68, y: 22, s: 130, z: 0.5, r: 0, c: "#a78bfa", d: 18 },
      { i: "manaPip", x: 30, y: 74, s: 100, z: 0.4, r: 0, c: "#fcd34d", d: 20 },
      { i: "manaPip", x: 50, y: 50, s: 60, z: 0.25, r: 0, c: "#f472b6", d: 16 },
    ],
    hearthstone: [
      { i: "manaCrystal", x: 15, y: 20, s: 260, z: 0.9, r: -6, c: "#38bdf8", d: 24 },
      { i: "manaCrystal", x: 80, y: 74, s: 220, z: 0.75, r: 8, c: "#f59e0b", d: 26 },
      { i: "rune", x: 62, y: 26, s: 170, z: 0.55, r: 0, c: "#fde68a", d: 22 },
      { i: "manaCrystal", x: 45, y: 82, s: 120, z: 0.4, r: 0, c: "#f59e0b", d: 18 },
      { i: "rune", x: 26, y: 72, s: 100, z: 0.3, r: 0, c: "#b45309", d: 20 },
    ],
    poker: [
      { i: "cardFace", x: 14, y: 22, s: 260, z: 0.85, r: -12, c: "#e8e6e3", d: 26 },
      { i: "cardFace", x: 82, y: 72, s: 240, z: 0.8, r: 10, c: "#e8e6e3", d: 28 },
      { i: "chip", x: 66, y: 24, s: 180, z: 0.6, r: 0, c: "#d4af37", d: 20 },
      { i: "chip", x: 24, y: 74, s: 140, z: 0.5, r: 0, c: "#4ade80", d: 22 },
      { i: "suitSpade", x: 52, y: 40, s: 100, z: 0.35, r: -6, c: "#fff", d: 18 },
      { i: "suitHeart", x: 46, y: 68, s: 80, z: 0.3, r: 8, c: "#e11d48", d: 16 },
    ],
    "2hh": [
      { i: "twoCards", x: 20, y: 24, s: 300, z: 0.9, r: -8, c: "#e8e6e3", d: 26 },
      { i: "twoCards", x: 80, y: 74, s: 260, z: 0.8, r: 8, c: "#fb7185", d: 28 },
      { i: "chip", x: 62, y: 22, s: 140, z: 0.5, r: 0, c: "#38bdf8", d: 20 },
      { i: "suitSpade", x: 30, y: 78, s: 90, z: 0.35, r: 0, c: "#fb7185", d: 18 },
      { i: "suitHeart", x: 70, y: 48, s: 70, z: 0.28, r: 0, c: "#38bdf8", d: 16 },
    ],
    badugi: [
      { i: "triad", x: 18, y: 24, s: 320, z: 0.85, r: -4, c: "#e0f2fe", d: 26 },
      { i: "triad", x: 82, y: 72, s: 260, z: 0.7, r: 6, c: "#94a3b8", d: 28 },
      { i: "chip", x: 60, y: 24, s: 120, z: 0.4, r: 0, c: "#e0f2fe", d: 20 },
      { i: "manaPip", x: 30, y: 76, s: 90, z: 0.3, r: 0, c: "#94a3b8", d: 18 },
    ],
    contact: [
      { i: "signal", x: 20, y: 26, s: 260, z: 0.8, r: -6, c: "#8b5cf6", d: 26 },
      { i: "signal", x: 80, y: 72, s: 220, z: 0.65, r: 6, c: "#d4af37", d: 28 },
      { i: "starDot", x: 50, y: 45, s: 30, z: 0.2, r: 0, c: "#fff", d: 14 },
      { i: "starDot", x: 68, y: 30, s: 24, z: 0.15, r: 0, c: "#fff", d: 12 },
      { i: "starDot", x: 32, y: 78, s: 20, z: 0.1, r: 0, c: "#fff", d: 10 },
    ],
  };

  /* --------- Build fleets into each layer --------- */
  const layerMap = new Map();

  document.querySelectorAll("#bg-stage .bg-layer").forEach((layer) => {
    const key = layer.dataset.bg;
    const spec = FLEETS[key];
    if (!spec) return;

    const fleet = document.createElement("div");
    fleet.className = "bg-fleet";
    spec.forEach((a, idx) => {
      const el = document.createElement("span");
      el.className = "bg-asset";
      el.dataset.z = a.z;
      el.dataset.rot = a.r;
      el.style.setProperty("--x", a.x + "%");
      el.style.setProperty("--y", a.y + "%");
      el.style.setProperty("--s", a.s + "px");
      el.style.setProperty("--rot", a.r + "deg");
      el.style.setProperty("--z", a.z);
      el.style.setProperty("--drift", a.d + "s");
      el.style.setProperty("--tint", a.c);
      /* Stagger idle animation start */
      el.style.animationDelay = (idx * -3.5) % 20 + "s";
      el.innerHTML = ICONS[a.i] || "";
      fleet.appendChild(el);
    });

    layer.appendChild(fleet);
    layerMap.set(layer, { key, spec, fleet });
  });

  /* --------- Scroll-driven progress on the active layer --------- */
  const sections = ["hero", "about", "esports", "poker", "innovation", "play", "contact"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  function sectionForActiveLayer() {
    const key = document.body.dataset.bg;
    /* Find the section currently mapped to this bg key */
    for (const s of sections) {
      const bg = s.dataset.bg;
      if (bg === key) return s;
      if (s.hasAttribute("data-bg-from-tab")) {
        const t = s.querySelector('[role="tab"][aria-selected="true"]');
        if (t?.dataset.theme === key) return s;
      }
    }
    return null;
  }

  let raf = 0;
  function tick() {
    raf = 0;
    const active = document.querySelector("#bg-stage .bg-layer.is-active");
    if (!active) return;

    const s = sectionForActiveLayer();
    if (!s) return;

    const rect = s.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    /* Progress: -1 (below), 0 (center), +1 (above) */
    const center = rect.top + rect.height * 0.5;
    const p = (center - vh * 0.5) / (vh * 0.5 + rect.height * 0.5);
    const clamped = Math.max(-1, Math.min(1, p));
    active.style.setProperty("--p", clamped.toFixed(3));
    /* Enter progress (0..1) — used for scale-in from far */
    const enter = 1 - Math.min(1, Math.abs(clamped));
    active.style.setProperty("--enter", enter.toFixed(3));
  }

  function schedule() {
    if (raf) return;
    raf = requestAnimationFrame(tick);
  }

  if (!reduced) {
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    /* Re-schedule on bg change (mutation on body[data-bg]) */
    new MutationObserver(schedule).observe(document.body, {
      attributes: true,
      attributeFilter: ["data-bg"],
    });
    schedule();
  }
})();
