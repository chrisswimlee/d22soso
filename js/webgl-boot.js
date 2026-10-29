/* Defer Three.js until idle (bg fleets) or until a panel canvas is near. */
import { reduced, whenIdle, nearViewport } from "./pref.js";

const booted = new Set();

/* Save-Data, 2G/3G or ≤2 GB devices skip the ambient fleets (~490 KB of
   Three.js). Interactive card canvases still boot when you reach them. */
const lean = (() => {
  const c = navigator.connection;
  if (c && (c.saveData || /(^|-)(2g|3g)$/.test(c.effectiveType || ""))) return true;
  return typeof navigator.deviceMemory === "number" && navigator.deviceMemory <= 2;
})();
let interactivesPromise = null;
let bgScenePromise = null;

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

function bootBgScene() {
  const canvas = document.getElementById("webgl-bg");
  if (reduced || lean) {
    if (canvas) canvas.style.display = "none";
    return Promise.resolve(null);
  }
  if (!canvas) return Promise.resolve(null);
  if (!bgScenePromise) {
    bgScenePromise = import("./webgl-scene.js")
      .then((mod) => {
        booted.add("webgl-bg");
        return mod.initBgScene(canvas);
      })
      .catch((err) => {
        bgScenePromise = null;
        booted.delete("webgl-bg");
        throw err;
      });
  }
  return bgScenePromise;
}

export function getBgScene() {
  return bgScenePromise || bootBgScene();
}

export function startWebGL({ immediate = false } = {}) {
  if (immediate) {
    bootBgScene();
  } else if (!reduced) {
    whenIdle(() => {
      bootBgScene();
    });
  } else {
    const canvas = document.getElementById("webgl-bg");
    if (canvas) canvas.style.display = "none";
  }

  bootCanvas("cards-2hh", "init2HH");
  bootCanvas("cards-badugi", "initBadugi");
  return bgScenePromise || Promise.resolve(null);
}
