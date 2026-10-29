/* Smooth scroll (Lenis). Desktop wheel/trackpad only — touch stays native.
   Off under prefers-reduced-motion and coarse pointers. If Lenis fails to
   load, every helper below falls back to native document scrolling. */
import { reduced, coarse } from "./pref.js";

let lenis = null;

/* Nodes whose wheel events stay native: modal dialogs, the 2HH table,
   anything that scrolls on its own, or opts out with data-lenis-prevent. */
const PREVENT = "dialog, iframe, .play-frame-wrap, [data-lenis-prevent]";

/** True once Lenis is running and not paused. */
export function isSmoothActive() {
  return !!lenis && !lenis.isStopped;
}

/**
 * Scroll the document to a Y position. Uses Lenis when active, otherwise
 * native scrollTo (smooth unless reduced motion). Resolves when settled.
 */
export function scrollToY(top, { immediate = false } = {}) {
  const y = Math.max(0, Math.round(top));
  if (isSmoothActive()) {
    return new Promise((resolve) => {
      lenis.scrollTo(y, {
        immediate,
        duration: 1.1,
        easing: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
        force: true,
        onComplete: () => resolve(),
      });
      if (immediate) resolve();
    });
  }
  const scroller = document.scrollingElement || document.documentElement;
  try {
    scroller.scrollTo({ top: y, left: 0, behavior: reduced || immediate ? "instant" : "smooth" /* "auto" would inherit html{scroll-behavior:smooth} */ });
  } catch (_) {
    scroller.scrollTop = y;
  }
  return Promise.resolve();
}

/* Pause while the intro holds the page, the 2HH table is immersive,
   or a modal dialog is open; resume otherwise. */
function syncPaused() {
  if (!lenis) return;
  const root = document.documentElement;
  const hold =
    root.classList.contains("is-intro-pending") ||
    document.body.classList.contains("play-2hh-immersive") ||
    !!document.querySelector("dialog[open]");
  if (hold && !lenis.isStopped) lenis.stop();
  else if (!hold && lenis.isStopped) lenis.start();
}

export async function initSmoothScroll() {
  if (reduced || coarse || lenis) return;
  let Lenis;
  try {
    ({ default: Lenis } = await import("lenis"));
  } catch (_) {
    return; /* CDN blocked or offline — native scroll stays */
  }

  lenis = new Lenis({
    autoRaf: true, /* rAF pauses with the tab, per motion rules */
    lerp: 0.12, /* lower = longer glide; 0.12 keeps the wheel close to the hand */
    smoothWheel: true,
    syncTouch: false,
    anchors: false, /* in-page links route through theme-nav goToHash */
    prevent: (node) => !!node.closest?.(PREVENT),
  });

  const watch = new MutationObserver(syncPaused);
  watch.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  watch.observe(document.body, { attributes: true, attributeFilter: ["class"] });
  document.querySelectorAll("dialog").forEach((d) =>
    watch.observe(d, { attributes: true, attributeFilter: ["open"] })
  );
  syncPaused();
}
