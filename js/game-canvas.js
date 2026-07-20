/* Retired — panel scenes now live in js/webgl-interactives.js (Three.js + GSAP).
 * Kept as an empty shim so any stale cache references fail quietly.
 */
(function (global) {
  global.D22Canvas = global.D22Canvas || {
    initFog() {},
    initMinimap() {},
    initRaceRoll() {
      return { roll() {} };
    },
    initBattleMap() {},
    init2HH() {},
    initBadugi() {},
  };
})(window);
