/* Scroll progress and one-shot theater enters */
import gsap from "../vendor/gsap/index.js";
import { reduced } from "./pref.js";
import { measureHeaderHeight } from "./theme-nav.js";

const afterTimers = new WeakMap();

function ensureAfterglow(host) {
  let node = host.querySelector(":scope > .theater-after");
  if (node) return node;
  node = document.createElement("span");
  node.className = "theater-after";
  node.setAttribute("aria-hidden", "true");
  host.prepend(node);
  return node;
}

export function playTheaterAfter(el, kind) {
  if (!el || reduced) return;
  const dialect = kind || el.getAttribute("data-enter") || el.getAttribute("data-reveal") || "";
  if (!dialect) return;
  const node = ensureAfterglow(el);
  el.setAttribute("data-after", dialect);
  node.classList.remove("is-on");
  void node.offsetWidth;
  node.classList.add("is-on");
  const prev = afterTimers.get(el);
  if (prev) clearTimeout(prev);
  afterTimers.set(
    el,
    window.setTimeout(() => {
      node.classList.remove("is-on");
      if (el.getAttribute("data-after") === dialect) el.removeAttribute("data-after");
      afterTimers.delete(el);
    }, 820)
  );
}

export function warpBeat(el) {
  if (!el || reduced) return;
  if (el.classList.contains("is-theater-entering")) return;
  const tl = gsap.timeline({
    overwrite: "auto",
    onComplete: () => {
      gsap.set(el, { clearProps: "clipPath" });
      playTheaterAfter(el, "warp");
    },
  });
  tl.fromTo(
    el,
    { clipPath: "inset(46% 88% 46% 0)" },
    {
      clipPath: "inset(8% 22% 8% 0)",
      duration: 0.12,
      ease: "power2.in",
    }
  ).to(el, {
    clipPath: "inset(0% 0% 0% 0%)",
    duration: 0.36,
    ease: "power3.out",
  });
}

export function themeBeat(el, base) {
  if (!el || reduced) return;
  if (el.classList.contains("is-theater-entering")) return;
  if (base === "starcraft") {
    warpBeat(el);
    return;
  }
  if (base === "cnc") {
    const scan = el.querySelector(".theater-scanline") || ensureScanline(el);
    gsap.killTweensOf(scan);
    gsap.set(scan, { opacity: 0.9, top: "-10%" });
    gsap.to(scan, { top: "108%", duration: 0.48, ease: "none" });
    gsap.to(scan, { opacity: 0, duration: 0.14, delay: 0.42 });
    playTheaterAfter(el, "scan");
    return;
  }
  if (base === "mtg") {
    el.classList.remove("is-foil-sweep");
    void el.offsetWidth;
    el.classList.add("is-foil-sweep");
    window.setTimeout(() => el.classList.remove("is-foil-sweep"), 880);
    playTheaterAfter(el, "deal");
    return;
  }
  if (base === "warcraft") {
    gsap.fromTo(
      el,
      { y: -16 },
      { y: 0, duration: 0.4, ease: "power3.out", overwrite: "auto", clearProps: "y" }
    );
    playTheaterAfter(el, "drop");
    return;
  }
  if (base === "hearthstone") {
    playTheaterAfter(el, "float");
  }
}

function ensureScanline(host) {
  let scan = host.querySelector(".theater-scanline");
  if (scan) return scan;
  scan = document.createElement("span");
  scan.className = "theater-scanline";
  scan.setAttribute("aria-hidden", "true");
  host.prepend(scan);
  return scan;
}

export function initMotion() {
/* ---------- Scroll effects ---------- */
const progressBar = document.querySelector(".scroll-progress-bar");
const header = document.querySelector(".site-header");
const revealNodes = [...document.querySelectorAll("[data-reveal]")];

/* Keep body offset in sync when the fixed header wraps (mobile) */
function syncHeaderOffset() {
  measureHeaderHeight();
}
syncHeaderOffset();
window.addEventListener("resize", syncHeaderOffset, { passive: true });
if (typeof ResizeObserver !== "undefined" && header) {
  new ResizeObserver(syncHeaderOffset).observe(header);
}

/* One-shot theater enters — each dialect owns its fly-in; quiet re-entry */
const THEATER_DIALECTS = new Set([
  "warp",
  "scan",
  "drop",
  "deal",
  "lid",
  "float",
  "page",
  "chip",
  "felt",
  "twist",
  "jump",
]);

function staggerParts(el) {
  const parts = [];
  const tag = el.querySelector(".game-tag, .lt-label");
  const plaque = el.querySelector(".plaque");
  const copy = el.querySelector(
    ".panel-grid > div:first-child, .book-copy, .about-tldr, .about-thesis, .lower-third > p, .felt-card > p"
  );
  const media = el.querySelector(
    ".panel-media, .book-showcase, .poker-photo, .play-frame-wrap, .logo-inline"
  );
  if (tag) parts.push(tag);
  if (plaque) parts.push(plaque);
  const heading = el.querySelector("h3, .lower-third > strong");
  if (heading) parts.push(heading);
  if (copy) parts.push(copy);
  if (media) parts.push(media);
  return parts;
}

const theaterEntering = new WeakSet();

function finishTheaterEnter(el) {
  theaterEntering.delete(el);
  el.classList.remove("is-theater-entering");
  el.setAttribute("data-entered", "");
  gsap.set(el, {
    clearProps:
      "clipPath,opacity,transform,filter,scale,x,y,rotateX,rotateY,rotateZ,skewX,skewY",
  });
  const parts = staggerParts(el);
  if (parts.length) {
    gsap.set(parts, {
      clearProps: "opacity,transform,x,y,rotateY,rotateX,scale,filter",
    });
  }
  const extras = el.querySelectorAll(
    ".career-timeline li, .interview-cite, .book-3d, .play-frame-wrap, .panel-img, .theater-scanline"
  );
  if (extras.length) {
    gsap.set(extras, {
      clearProps:
        "opacity,transform,x,y,rotateY,rotateX,scale,scaleY,skewX,filter,top",
    });
  }
  playTheaterAfter(el);
}

function playTheaterEnter(el) {
  if (!el || reduced) {
    if (el) el.setAttribute("data-entered", "");
    return;
  }
  if (el.hasAttribute("data-entered") || theaterEntering.has(el)) return;

  const dialect = el.getAttribute("data-reveal") || "";
  const enterKind = el.getAttribute("data-enter") || dialect;
  if (!THEATER_DIALECTS.has(dialect) && !el.hasAttribute("data-enter")) return;

  theaterEntering.add(el);
  el.classList.add("is-theater-entering");

  const tl = gsap.timeline({
    defaults: { ease: "power2.out" },
    onComplete: () => finishTheaterEnter(el),
  });

  const parts = staggerParts(el);
  const cols = el.querySelectorAll(".panel-grid > *");

  /* Each dialect owns a distinct primary fly-in — no shared scout for all */
  if (enterKind === "warp") {
    /* StarCraft — slit, then horizon iris + scale settle */
    gsap.set(el, {
      opacity: 1,
      clipPath: "inset(46% 100% 46% 0)",
      scale: 0.97,
      x: -22,
      transformOrigin: "0% 50%",
    });
    if (parts.length) gsap.set(parts, { opacity: 0, x: -26 });
    tl.to(
      el,
      {
        clipPath: "inset(10% 28% 10% 0)",
        x: -8,
        duration: 0.16,
        ease: "power2.in",
      },
      0
    );
    tl.to(
      el,
      {
        clipPath: "inset(0% 0% 0% 0%)",
        scale: 1,
        x: 0,
        duration: 0.58,
        ease: "power3.out",
      },
      0.14
    );
    if (parts.length) {
      tl.to(
        parts,
        { opacity: 1, x: 0, duration: 0.42, stagger: 0.06, ease: "power2.out" },
        0.3
      );
    }
  } else if (enterKind === "scan") {
    /* C&C — hold the CRT line, snap-expand, phosphor wipe */
    const scan = ensureScanline(el);
    gsap.set(el, {
      opacity: 1,
      clipPath: "inset(49.2% 0 49.2% 0)",
      scaleY: 0.045,
      transformOrigin: "50% 50%",
    });
    if (parts.length) gsap.set(parts, { opacity: 0, y: 8 });
    tl.to(el, { duration: 0.1 }, 0);
    tl.to(
      el,
      {
        clipPath: "inset(0% 0% 0% 0%)",
        scaleY: 1,
        duration: 0.42,
        ease: "power4.out",
      },
      0.1
    );
    gsap.set(scan, { opacity: 0.95, top: "-10%" });
    tl.to(scan, { top: "108%", duration: 0.55, ease: "none" }, 0.18);
    tl.to(scan, { opacity: 0, duration: 0.12 }, 0.68);
    if (parts.length) {
      tl.to(parts, { opacity: 1, y: 0, duration: 0.32, stagger: 0.05, ease: "power2.out" }, 0.28);
    }
  } else if (enterKind === "drop") {
    /* Warcraft — banner falls with weight, then cloth settle */
    gsap.set(el, {
      opacity: 1,
      y: -96,
      rotateZ: -3.4,
      transformOrigin: "50% 0%",
    });
    if (parts.length) gsap.set(parts, { opacity: 0, y: -28 });
    tl.to(el, { y: 10, rotateZ: 1.4, duration: 0.4, ease: "power3.in" }, 0);
    tl.to(el, { y: 0, rotateZ: 0, duration: 0.42, ease: "power3.out" }, 0.38);
    if (parts.length) {
      tl.to(
        parts,
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.07, ease: "power2.out" },
        0.34
      );
    }
  } else if (enterKind === "deal") {
    /* MTG — cards slap in from the right with yaw, then foil */
    const dealt = cols.length ? cols : parts;
    gsap.set(el, { opacity: 1, clipPath: "none" });
    if (dealt.length) {
      gsap.set(dealt, {
        transformOrigin: "88% 40%",
        rotateY: 56,
        rotateZ: 5,
        x: 88,
        y: -14,
        opacity: 0,
      });
      tl.to(
        dealt,
        {
          rotateY: 0,
          rotateZ: 0,
          x: 0,
          y: 6,
          opacity: 1,
          duration: 0.52,
          stagger: 0.11,
          ease: "power4.out",
        },
        0
      );
      tl.to(dealt, { y: 0, duration: 0.22, stagger: 0.06, ease: "power2.out" }, 0.48);
    }
    tl.add(() => {
      el.classList.add("is-foil-sweep");
    }, 0.32);
    tl.add(() => {
      el.classList.remove("is-foil-sweep");
    }, 1.15);
  } else if (enterKind === "lid") {
    /* Cube — storage-box lid opens after a beat, contents lift */
    gsap.set(el, {
      opacity: 1,
      clipPath: "inset(0 0 100% 0)",
      transformOrigin: "50% 0%",
    });
    tl.to(el, { duration: 0.08 }, 0);
    tl.to(
      el,
      {
        clipPath: "inset(0 0 0% 0)",
        duration: 0.82,
        ease: "power2.inOut",
      },
      0.08
    );
    const lift = el.querySelectorAll(".panel-media, .interview-cite, .plaque, h3");
    if (lift.length) {
      gsap.set(lift, { y: 42, opacity: 0, rotateX: -12 });
      tl.to(
        lift,
        {
          y: 0,
          opacity: 1,
          rotateX: 0,
          duration: 0.52,
          stagger: 0.08,
          ease: "power3.out",
        },
        0.42
      );
    }
  } else if (enterKind === "float") {
    /* Hearthstone — rise from the hearth; plaque stamps */
    gsap.set(el, {
      opacity: 0,
      y: 68,
      scale: 0.94,
      transformOrigin: "50% 80%",
    });
    tl.to(
      el,
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.78,
        ease: "power3.out",
      },
      0
    );
    const shot = el.querySelector(".panel-img--screenshot, .panel-media");
    const plaque = el.querySelector(".plaque");
    if (shot) {
      gsap.set(shot, { scale: 0.88, filter: "brightness(0.42) saturate(0.7)" });
      tl.to(
        shot,
        {
          scale: 1,
          filter: "brightness(1.08) saturate(1.08)",
          duration: 0.7,
          ease: "power2.out",
        },
        0.12
      );
      tl.to(shot, { filter: "brightness(1) saturate(1)", duration: 0.28, ease: "power1.out" }, 0.78);
    }
    if (plaque) {
      gsap.set(plaque, { scale: 1.28, opacity: 0 });
      tl.to(plaque, { scale: 0.96, opacity: 1, duration: 0.28, ease: "power3.out" }, 0.38);
      tl.to(plaque, { scale: 1, duration: 0.22, ease: "power2.out" }, 0.64);
    }
  } else if (enterKind === "page") {
    /* Book — page lifts on the binding edge */
    gsap.set(el, {
      opacity: 1,
      rotateX: 16,
      y: 32,
      transformOrigin: "50% 100%",
    });
    const cover =
      el.querySelector(".book-3d") ||
      el.closest(".section-book")?.querySelector(".book-3d");
    const copy = el.querySelector(".book-copy");
    if (cover) gsap.set(cover, { rotateY: -68, rotateX: 14, opacity: 0.45 });
    if (copy) gsap.set(copy, { x: 36, opacity: 0 });
    tl.to(el, { rotateX: 0, y: 0, duration: 0.68, ease: "power3.out" }, 0);
    if (cover) {
      tl.to(
        cover,
        {
          rotateY: -22,
          rotateX: 6,
          opacity: 1,
          duration: 0.85,
          ease: "power3.out",
        },
        0.06
      );
    }
    if (copy) {
      tl.to(copy, { x: 0, opacity: 1, duration: 0.5, ease: "power2.out" }, 0.32);
    }
  } else if (enterKind === "chip") {
    /* Play — chip stacks onto the felt; poker photo plane settles */
    const table = el.querySelector(".play-frame-wrap");
    if (table) {
      gsap.set(el, { opacity: 1 });
      gsap.set(table, {
        scale: 0.84,
        y: 52,
        rotateX: 10,
        transformOrigin: "50% 100%",
      });
      tl.to(
        table,
        {
          scale: 1,
          y: -4,
          rotateX: 0,
          duration: 0.48,
          ease: "power3.out",
        },
        0
      );
      tl.to(table, { y: 0, duration: 0.28, ease: "power2.out" }, 0.46);
    } else {
      gsap.set(el, {
        opacity: 0,
        y: -28,
        scale: 0.88,
        rotateX: 14,
        transformOrigin: "50% 0%",
      });
      tl.to(
        el,
        {
          opacity: 1,
          y: 6,
          scale: 1,
          rotateX: 0,
          duration: 0.48,
          ease: "power3.out",
        },
        0
      );
      tl.to(el, { y: 0, duration: 0.26, ease: "power2.out" }, 0.46);
    }
  } else if (enterKind === "felt") {
    /* Poker — rail wipe with yaw */
    const fromLeft = el.classList.contains("lower-third");
    gsap.set(el, {
      opacity: 1,
      x: fromLeft ? -64 : 56,
      rotateY: fromLeft ? -22 : 24,
      clipPath: fromLeft ? "inset(0 100% 0 0)" : "inset(0 0 0 100%)",
      transformOrigin: fromLeft ? "0% 50%" : "100% 50%",
    });
    tl.to(
      el,
      {
        x: 0,
        rotateY: 0,
        clipPath: "inset(0 0% 0 0%)",
        duration: 0.68,
        ease: "power3.out",
      },
      0
    );
  } else if (enterKind === "twist") {
    /* About / copy heads — 3D yaw onto the spine */
    gsap.set(el, {
      opacity: 0,
      x: -28,
      rotateY: -28,
      rotateZ: -2.5,
      transformOrigin: "20% 50%",
    });
    tl.to(
      el,
      {
        opacity: 1,
        x: 0,
        rotateY: 0,
        rotateZ: 0,
        duration: 0.62,
        ease: "power3.out",
      },
      0
    );
  } else if (enterKind === "jump") {
    /* Stack pop from below — CTAs / maps, not a cartoon bounce */
    gsap.set(el, {
      opacity: 0,
      y: 48,
      scale: 0.9,
      transformOrigin: "50% 100%",
    });
    tl.to(
      el,
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.62,
        ease: "back.out(1.18)",
      },
      0
    );
  } else if (enterKind === "about-timeline") {
    gsap.set(el, { opacity: 1 });
    const years = el.querySelectorAll(".career-timeline li");
    if (years.length) {
      gsap.set(years, { opacity: 0, x: -18 });
      tl.to(
        years,
        {
          opacity: 1,
          x: 0,
          duration: 0.32,
          stagger: 0.038,
          ease: "power2.out",
        },
        0.04
      );
    } else {
      tl.to(el, { opacity: 1, duration: 0.4 }, 0);
    }
  } else {
    /* Fallback soft fade */
    gsap.set(el, { opacity: 0, y: 16 });
    tl.to(el, { opacity: 1, y: 0, duration: 0.5 }, 0);
  }
}

function revealEl(el) {
  if (!el) return;
  const dialect = el.getAttribute("data-reveal") || "";
  const wantsEnter =
    !reduced &&
    (THEATER_DIALECTS.has(dialect) || el.hasAttribute("data-enter")) &&
    !el.hasAttribute("data-entered");
  /* Arm GSAP before .is-inview so CSS reveal transitions never interpolate first */
  if (wantsEnter) el.classList.add("is-theater-entering");
  el.classList.add("is-inview");
  el.removeAttribute("data-exit");

  if (reduced) {
    el.setAttribute("data-entered", "");
    return;
  }

  if (wantsEnter) playTheaterEnter(el);
}

function concealEl(el) {
  if (!el || !el.classList.contains("is-inview")) return;
  /* Don't interrupt mid-enter — finish quietly when complete */
  if (el.classList.contains("is-theater-entering")) return;

  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight;
  const mid = rect.top + rect.height * 0.5;
  /* Leaving through the top → exit up; through the bottom → exit down */
  el.dataset.exit = mid < vh * 0.5 ? "up" : "down";
  el.classList.remove("is-inview");
}

function revealAll() {
  revealNodes.forEach(revealEl);
}

function isInViewport(el, pad) {
  const r = el.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight;
  const vw = window.innerWidth || document.documentElement.clientWidth;
  const p = pad == null ? 0 : pad;
  return r.bottom > p && r.right > 0 && r.top < vh - p && r.left < vw;
}

function syncReveals() {
  const band = Math.round((window.innerHeight || 0) * 0.06);
  revealNodes.forEach((el) => {
    if (isInViewport(el, band)) revealEl(el);
    else concealEl(el);
  });
}

function scrollProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
  if (progressBar) progressBar.style.width = pct + "%";
  if (header) header.classList.toggle("is-scrolled", window.scrollY > 12);
}

if (reduced) {
  revealAll();
} else {
  document.documentElement.classList.add("reveal-on");
  syncReveals();

  const revealObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) revealEl(entry.target);
        else concealEl(entry.target);
      });
    },
    {
      /* Shrink the “live” band so exits start as content leaves the frame */
      threshold: [0, 0.08, 0.18],
      rootMargin: "-6% 0px -8% 0px",
    }
  );
  revealNodes.forEach((el) => revealObs.observe(el));

  /* First paint: show whatever is already on screen */
  setTimeout(syncReveals, 80);
}

let ticking = false;
function onScrollFrame() {
  scrollProgress();
  ticking = false;
}

window.addEventListener(
  "scroll",
  () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScrollFrame);
    }
  },
  { passive: true }
);
window.addEventListener(
  "resize",
  () => {
    onScrollFrame();
    if (!reduced) syncReveals();
  },
  { passive: true }
);
onScrollFrame();

/* Hash landing: sync once scroll settles so the target enters cleanly */
function revealHashTarget() {
  const id = (location.hash || "").replace(/^#/, "");
  if (!id) return;
  requestAnimationFrame(() => {
    syncReveals();
    const section = document.getElementById(id);
    if (!section) return;
    section.querySelectorAll("[data-reveal]").forEach((el) => {
      if (isInViewport(el, 0)) revealEl(el);
    });
    if (section.hasAttribute("data-reveal") && isInViewport(section, 0)) {
      revealEl(section);
    }
  });
}
revealHashTarget();
window.addEventListener("hashchange", revealHashTarget);

}
