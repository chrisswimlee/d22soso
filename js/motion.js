/* Scroll progress, parallax, one-shot theater enters */
import gsap from "../vendor/gsap/index.js";
import { reduced } from "./pref.js";
import { measureHeaderHeight } from "./theme-nav.js";

export function initMotion() {
/* ---------- Scroll effects ---------- */
const progressBar = document.querySelector(".scroll-progress-bar");
const header = document.querySelector(".site-header");
const parallaxNodes = [...document.querySelectorAll("[data-parallax]")];
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
  const tag = el.querySelector(".game-tag, .eyebrow-badge, .lt-label");
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

function finishTheaterEnter(el) {
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
    ".heraldic-plate, .dossier-meta > div, .career-timeline li, .interview-cite, .book-3d, .play-frame-wrap, .panel-img, .theater-scanline"
  );
  if (extras.length) {
    gsap.set(extras, {
      clearProps:
        "opacity,transform,x,y,rotateY,rotateX,scale,scaleY,skewX,filter,top",
    });
  }
}

function playTheaterEnter(el) {
  if (!el || reduced) {
    if (el) el.setAttribute("data-entered", "");
    return;
  }
  if (el.hasAttribute("data-entered") || el.classList.contains("is-theater-entering")) return;

  const dialect = el.getAttribute("data-reveal") || "";
  const enterKind = el.getAttribute("data-enter") || dialect;
  if (!THEATER_DIALECTS.has(dialect) && !el.hasAttribute("data-enter")) return;

  el.classList.add("is-theater-entering");

  const tl = gsap.timeline({
    defaults: { ease: "power2.out" },
    onComplete: () => finishTheaterEnter(el),
  });

  const parts = staggerParts(el);
  const cols = el.querySelectorAll(".panel-grid > *");

  /* Each dialect owns a distinct primary fly-in — no shared scout for all */
  if (enterKind === "warp") {
    /* StarCraft — horizon iris from the accent edge + scale settle */
    gsap.set(el, {
      opacity: 1,
      clipPath: "inset(42% 100% 42% 0)",
      scale: 0.94,
      x: -36,
      filter: "brightness(1.35) saturate(1.2)",
      transformOrigin: "0% 50%",
    });
    if (parts.length) gsap.set(parts, { opacity: 0, x: -18 });
    tl.to(
      el,
      {
        clipPath: "inset(0% 0% 0% 0%)",
        scale: 1,
        x: 0,
        filter: "brightness(1) saturate(1)",
        duration: 0.85,
        ease: "power3.out",
      },
      0
    );
    if (parts.length) {
      tl.to(
        parts,
        { opacity: 1, x: 0, duration: 0.45, stagger: 0.07, ease: "power2.out" },
        0.28
      );
    }
  } else if (enterKind === "scan") {
    /* C&C — CRT boot: thin horizontal line expands; scanline wipe */
    gsap.set(el, {
      opacity: 1,
      clipPath: "inset(48% 0 48% 0)",
      scaleY: 0.06,
      transformOrigin: "50% 50%",
      filter: "brightness(1.5) contrast(1.2)",
    });
    if (parts.length) gsap.set(parts, { opacity: 0 });
    tl.to(
      el,
      {
        clipPath: "inset(0% 0% 0% 0%)",
        scaleY: 1,
        filter: "brightness(1) contrast(1)",
        duration: 0.55,
        ease: "power2.inOut",
      },
      0
    );
    const scan = el.querySelector(".theater-scanline");
    if (scan) {
      gsap.set(scan, { opacity: 0.9, top: "-8%" });
      tl.to(scan, { top: "105%", duration: 0.65, ease: "none" }, 0.2);
      tl.to(scan, { opacity: 0, duration: 0.15 }, 0.75);
    }
    const rows = el.querySelectorAll(".dossier-meta > div");
    if (rows.length) {
      gsap.set(rows, { opacity: 0, filter: "brightness(2)" });
      tl.to(
        rows,
        {
          opacity: 1,
          filter: "brightness(1)",
          duration: 0.3,
          stagger: 0.09,
          ease: "power1.out",
        },
        0.35
      );
    }
    if (parts.length) {
      tl.to(parts, { opacity: 1, duration: 0.4, stagger: 0.06 }, 0.25);
    }
  } else if (enterKind === "drop") {
    /* Warcraft — banner drops from above with slight skew */
    gsap.set(el, {
      opacity: 1,
      y: -72,
      rotateZ: -2.2,
      transformOrigin: "50% 0%",
    });
    if (parts.length) gsap.set(parts, { opacity: 0, y: -20 });
    tl.to(
      el,
      {
        y: 0,
        rotateZ: 0,
        duration: 0.75,
        ease: "power3.out",
      },
      0
    );
    const plate = el.querySelector(".heraldic-plate");
    if (plate) {
      gsap.set(plate, {
        transformOrigin: "50% 0%",
        scaleY: 0.06,
        skewX: 2,
        opacity: 0.3,
      });
      tl.to(
        plate,
        {
          scaleY: 1,
          skewX: 0,
          opacity: 1,
          duration: 0.7,
          ease: "power3.out",
        },
        0.18
      );
    }
    if (parts.length) {
      tl.to(
        parts,
        { opacity: 1, y: 0, duration: 0.45, stagger: 0.08, ease: "power2.out" },
        0.22
      );
    }
  } else if (enterKind === "deal") {
    /* MTG — cards deal in from the right with yaw */
    gsap.set(el, { opacity: 1, clipPath: "none" });
    if (cols.length) {
      gsap.set(cols, {
        transformOrigin: "80% 50%",
        rotateY: 42,
        x: 72,
        opacity: 0,
      });
      tl.to(
        cols,
        {
          rotateY: 0,
          x: 0,
          opacity: 1,
          duration: 0.65,
          stagger: 0.12,
          ease: "power3.out",
        },
        0
      );
    } else if (parts.length) {
      gsap.set(parts, { rotateY: 30, x: 48, opacity: 0 });
      tl.to(
        parts,
        {
          rotateY: 0,
          x: 0,
          opacity: 1,
          duration: 0.55,
          stagger: 0.08,
          ease: "power2.out",
        },
        0
      );
    }
    tl.add(() => {
      el.classList.add("is-foil-sweep");
    }, 0.4);
    tl.add(() => {
      el.classList.remove("is-foil-sweep");
    }, 1.2);
  } else if (enterKind === "lid") {
    /* Cube — storage-box lid opens downward */
    gsap.set(el, {
      opacity: 1,
      clipPath: "inset(0 0 100% 0)",
      transformOrigin: "50% 0%",
    });
    tl.to(
      el,
      {
        clipPath: "inset(0 0 0% 0)",
        duration: 0.85,
        ease: "power3.inOut",
      },
      0
    );
    const lift = el.querySelectorAll(".panel-media, .interview-cite, .plaque, h3");
    if (lift.length) {
      gsap.set(lift, { y: 36, opacity: 0, rotateX: -8 });
      tl.to(
        lift,
        {
          y: 0,
          opacity: 1,
          rotateX: 0,
          duration: 0.55,
          stagger: 0.09,
          ease: "power2.out",
        },
        0.4
      );
    }
  } else if (enterKind === "float") {
    /* Hearthstone — soft rise from below; plaque stamp */
    gsap.set(el, {
      opacity: 0,
      y: 56,
      scale: 0.96,
      transformOrigin: "50% 80%",
    });
    tl.to(
      el,
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
        ease: "power2.out",
      },
      0
    );
    const shot = el.querySelector(".panel-img--screenshot, .panel-media");
    const plaque = el.querySelector(".plaque");
    if (shot) {
      gsap.set(shot, { scale: 0.9, filter: "brightness(0.55) saturate(0.8)" });
      tl.to(
        shot,
        {
          scale: 1,
          filter: "brightness(1) saturate(1)",
          duration: 0.75,
          ease: "power2.out",
        },
        0.15
      );
    }
    if (plaque) {
      gsap.set(plaque, { scale: 1.12, opacity: 0 });
      tl.to(
        plaque,
        { scale: 1, opacity: 1, duration: 0.4, ease: "power2.out" },
        0.4
      );
    }
  } else if (enterKind === "page") {
    /* Book — page lifts on the binding edge */
    gsap.set(el, {
      opacity: 1,
      rotateX: 14,
      y: 28,
      transformOrigin: "50% 100%",
    });
    const cover =
      el.querySelector(".book-3d") ||
      el.closest(".section-book")?.querySelector(".book-3d");
    const copy = el.querySelector(".book-copy");
    if (cover) gsap.set(cover, { rotateY: -48, rotateX: 12, opacity: 0.6 });
    if (copy) gsap.set(copy, { x: 28, opacity: 0 });
    tl.to(
      el,
      { rotateX: 0, y: 0, duration: 0.7, ease: "power3.out" },
      0
    );
    if (cover) {
      tl.to(
        cover,
        {
          rotateY: -24,
          rotateX: 6,
          opacity: 1,
          duration: 0.9,
          ease: "power3.out",
        },
        0.08
      );
    }
    if (copy) {
      tl.to(
        copy,
        { x: 0, opacity: 1, duration: 0.55, ease: "power2.out" },
        0.28
      );
    }
  } else if (enterKind === "chip") {
    /* Play — chip stacks onto the felt */
    const table = el.querySelector(".play-frame-wrap") || el;
    gsap.set(el, { opacity: 1 });
    gsap.set(table, {
      scale: 0.88,
      y: 40,
      rotateX: 8,
      transformOrigin: "50% 100%",
      filter: "brightness(0.85)",
    });
    tl.to(
      table,
      {
        scale: 1,
        y: 0,
        rotateX: 0,
        filter: "brightness(1)",
        duration: 0.7,
        ease: "power3.out",
      },
      0
    );
  } else if (enterKind === "felt" || enterKind === "twist") {
    /* Poker lower-thirds / felt cards — slide across the rail with yaw */
    const fromLeft = enterKind === "felt" || el.classList.contains("lower-third");
    gsap.set(el, {
      opacity: 0,
      x: fromLeft ? -56 : 48,
      rotateY: fromLeft ? -18 : 22,
      transformOrigin: fromLeft ? "0% 50%" : "100% 50%",
    });
    tl.to(
      el,
      {
        opacity: 1,
        x: 0,
        rotateY: 0,
        duration: 0.7,
        ease: "power3.out",
      },
      0
    );
  } else if (enterKind === "jump") {
    /* Springy pop from below — used by secondary felt cards / CTAs */
    gsap.set(el, {
      opacity: 0,
      y: 64,
      scale: 0.82,
      transformOrigin: "50% 100%",
    });
    tl.to(
      el,
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.7,
        ease: "back.out(1.4)",
      },
      0
    );
  } else if (enterKind === "about-prose") {
    gsap.set(el, { opacity: 0, x: -20 });
    tl.to(el, { opacity: 1, x: 0, duration: 0.65, ease: "power2.out" }, 0);
  } else if (enterKind === "about-timeline") {
    gsap.set(el, { opacity: 1 });
    const years = el.querySelectorAll(".career-timeline li");
    if (years.length) {
      gsap.set(years, { opacity: 0, x: -14 });
      tl.to(
        years,
        {
          opacity: 1,
          x: 0,
          duration: 0.35,
          stagger: 0.045,
          ease: "power1.out",
        },
        0.05
      );
    } else {
      tl.to(el, { opacity: 1, duration: 0.4 }, 0);
    }
  } else {
    /* Fallback soft fade */
    gsap.set(el, { opacity: 0, y: 20 });
    tl.to(el, { opacity: 1, y: 0, duration: 0.55 }, 0);
  }
}

function revealEl(el) {
  if (!el) return;
  el.classList.add("is-inview");
  el.removeAttribute("data-exit");

  if (reduced) {
    el.setAttribute("data-entered", "");
    return;
  }

  const dialect = el.getAttribute("data-reveal") || "";
  const wantsEnter =
    THEATER_DIALECTS.has(dialect) || el.hasAttribute("data-enter");
  if (wantsEnter && !el.hasAttribute("data-entered")) {
    playTheaterEnter(el);
  }
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
  /* Clear parallax inline transform so CSS exit motion can run */
  if (el.hasAttribute("data-parallax")) el.style.transform = "";
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

function revealVisible() {
  syncReveals();
}

function scrollProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
  if (progressBar) progressBar.style.width = pct + "%";
  if (header) header.classList.toggle("is-scrolled", window.scrollY > 12);
}

function updateParallax() {
  if (reduced) return;
  const vh = window.innerHeight;
  parallaxNodes.forEach((el) => {
    if (!el.classList.contains("is-inview") && el.hasAttribute("data-reveal")) {
      el.style.transform = "";
      return;
    }
    const speed = parseFloat(el.dataset.parallax || "0.1") || 0.1;
    const rect = el.getBoundingClientRect();
    const center = rect.top + rect.height / 2;
    const offset = (center - vh / 2) * speed * -0.35;
    el.style.transform = "translate3d(0," + offset.toFixed(2) + "px,0)";
  });
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
  updateParallax();
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
