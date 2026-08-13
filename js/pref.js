/* Shared motion / pointer prefs */
export const reduced =
  typeof matchMedia !== "undefined" &&
  matchMedia("(prefers-reduced-motion: reduce)").matches;

export const coarse =
  typeof matchMedia !== "undefined" &&
  (matchMedia("(pointer: coarse)").matches || matchMedia("(hover: none)").matches);

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
