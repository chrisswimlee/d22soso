/* Retired spring helpers — motion is GSAP-driven in the WebGL modules.
 * Exposes `reduced` for any legacy callers.
 */
(function (global) {
  const reduced =
    typeof matchMedia !== "undefined" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches;
  global.D22Physics = { reduced };
})(window);
