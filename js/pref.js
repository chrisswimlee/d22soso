/* Shared motion / pointer prefs */
export const reduced =
  typeof matchMedia !== "undefined" &&
  matchMedia("(prefers-reduced-motion: reduce)").matches;

export const coarse =
  typeof matchMedia !== "undefined" &&
  (matchMedia("(pointer: coarse)").matches || matchMedia("(hover: none)").matches);

/** Backing-store density for WebGL / canvas. Cap phone at 1.5, desktop at 2. */
export function drawingDpr() {
  const dpr = window.devicePixelRatio || 1;
  if (reduced) return 1;
  return Math.min(dpr, coarse ? 1.5 : 2);
}

export const INTERACTIVE =
  "a, button, input, textarea, select, summary, [role='tab'], [role='button'], .command-nav, canvas, iframe, dialog, .theme-pip, .skip-link, .play-frame-wrap, .hotkey-help, .feedback-dialog, .hero-pillar, .hero-trio";

export function isInteractive(node) {
  if (!(node instanceof Element)) return false;
  return !!node.closest(INTERACTIVE);
}

export function atmosphereBlocked() {
  if (reduced) return true;
  if (document.documentElement.classList.contains("is-intro-pending")) return true;
  if (document.documentElement.hasAttribute("data-intro")) return true;
  if (document.body.classList.contains("play-2hh-immersive")) return true;
  return false;
}

export function isAtmosphereGrab() {
  const body = document.body;
  return (
    body.classList.contains("is-dragging-fleet") ||
    body.classList.contains("is-dragging-card")
  );
}

export function whenIdle(fn, timeout = 1400) {
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(fn, { timeout });
  } else {
    setTimeout(fn, Math.min(timeout, 400));
  }
}

export function nearViewport(el, fn, rootMargin = "280px 0px") {
  if (!el) return;
  if (typeof IntersectionObserver === "undefined") {
    fn();
    return;
  }
  const obs = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      obs.disconnect();
      fn();
    },
    { rootMargin, threshold: 0.01 }
  );
  obs.observe(el);
}
