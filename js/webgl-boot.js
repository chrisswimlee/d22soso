/* Defer Three.js until idle (bg fleets) or until a panel canvas is near. */
import { reduced, whenIdle, nearViewport } from "./pref.js";

const booted = new Set();
let interactivesPromise = null;
let raceApi = null;

function loadInteractives() {
  return (interactivesPromise ||= import("./webgl-interactives.js"));
}

function bootCanvas(id, initName, after) {
  const el = document.getElementById(id);
  if (!el) return;
  nearViewport(el, () => {
    if (booted.has(id)) return;
    booted.add(id);
    loadInteractives().then((mod) => {
      const api = mod[initName](el);
      after?.(api);
    });
  });
}

export function rollRace() {
  const el = document.getElementById("race-canvas");
  if (!el) return;
  if (raceApi) {
    raceApi.roll();
    return;
  }
  booted.add("race-canvas");
  loadInteractives().then((mod) => {
    raceApi = raceApi || mod.initRaceRoll(el);
    raceApi?.roll();
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

  bootCanvas("race-canvas", "initRaceRoll", (api) => {
    raceApi = api;
  });
  bootCanvas("battle-canvas", "initBattleMap");
  bootCanvas("cards-2hh", "init2HH");
  bootCanvas("cards-badugi", "initBadugi");
}
