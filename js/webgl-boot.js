/* Defer Three.js until idle (bg fleets) or until a panel canvas is near. */
import { reduced, whenIdle, nearViewport } from "./pref.js";

const booted = new Set();
let interactivesPromise = null;

function loadInteractives() {
  return (interactivesPromise ||= import("./webgl-interactives.js"));
}

function bootCanvas(id, initName) {
  const el = document.getElementById(id);
  if (!el) return;
  nearViewport(el, () => {
    if (booted.has(id)) return;
    booted.add(id);
    loadInteractives().then((mod) => {
      mod[initName](el);
    });
  });
}

export function startWebGL() {
  const canvas = document.getElementById("webgl-bg");
  if (reduced) {
    if (canvas) canvas.style.display = "none";
  } else {
    whenIdle(() => {
      if (!canvas || booted.has("webgl-bg")) return;
      booted.add("webgl-bg");
      import("./webgl-scene.js").then((mod) => mod.initBgScene(canvas));
    });
  }

  bootCanvas("cards-2hh", "init2HH");
  bootCanvas("cards-badugi", "initBadugi");
}
