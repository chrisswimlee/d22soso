/* Orchestration: chrome, motion, widgets. Three.js boots idle / on-viewport. */
import { initThemeNav } from "./js/theme-nav.js";
import { initMotion } from "./js/motion.js";
import { initWidgets } from "./js/widgets.js";
import { startWebGL } from "./js/webgl-boot.js";

initThemeNav();
initMotion();
initWidgets();
startWebGL();
