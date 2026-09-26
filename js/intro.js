/* Homepage enter: one fade of the hero on every visit. Pictures do not move. */
import { reduced } from "./pref.js";
import { startWebGL } from "./webgl-boot.js";

const FADE_MS = 600;

let finished = false;
let watchdog = 0;
let sceneApi = null;
const cleanups = [];

function onClean(fn) {
  cleanups.push(fn);
}

function runCleanups() {
  while (cleanups.length) {
    try {
      cleanups.pop()();
    } catch {
      /* ignore */
    }
  }
}

function isDeepLink() {
  const hash = location.hash || "";
  return hash !== "" && hash !== "#" && hash !== "#hero";
}

function shouldPlay() {
  return !(reduced || isDeepLink() || !document.getElementById("hero"));
}

function finish() {
  if (finished) return;
  finished = true;
  if (watchdog) {
    clearTimeout(watchdog);
    watchdog = 0;
  }
  runCleanups();
  const hero = document.querySelector(".hero");
  if (hero) {
    hero.style.transition = "none";
    hero.style.opacity = "1";
  }
  const root = document.documentElement;
  root.classList.remove("is-intro-pending", "is-intro-in");
  root.removeAttribute("data-intro");
  document.getElementById("intro-stage")?.remove();
  if (hero) {
    requestAnimationFrame(() => {
      hero.style.transition = "";
      hero.style.opacity = "";
    });
  }
  sceneApi?.setHeroScene?.();
}

function bindSkip() {
  const stage = document.getElementById("intro-stage");
  const skipBtn = stage?.querySelector(".intro-skip");
  const skip = () => finish();
  skipBtn?.addEventListener("click", skip);
  onClean(() => skipBtn?.removeEventListener("click", skip));

  const onKey = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      skip();
    }
  };
  window.addEventListener("keydown", onKey);
  onClean(() => window.removeEventListener("keydown", onKey));

  const skipLink = document.querySelector(".skip-link");
  skipLink?.addEventListener("click", skip);
  onClean(() => skipLink?.removeEventListener("click", skip));

  window.addEventListener("hashchange", skip);
  onClean(() => window.removeEventListener("hashchange", skip));
}

function play() {
  const root = document.documentElement;
  const stage = document.getElementById("intro-stage");
  const skipBtn = stage?.querySelector(".intro-skip");
  if (!stage) {
    finish();
    startWebGL().then((api) => {
      sceneApi = api;
      sceneApi?.setHeroScene?.();
    });
    return;
  }

  root.classList.add("is-intro-pending");
  root.setAttribute("data-intro", "playing");
  stage.hidden = false;
  if (skipBtn) skipBtn.hidden = false;
  bindSkip();

  startWebGL()
    .then((api) => {
      sceneApi = api;
    })
    .catch(() => {
      startWebGL();
    });

  window.setTimeout(() => {
    if (finished) return;
    root.classList.add("is-intro-in");
    watchdog = window.setTimeout(finish, FADE_MS + 80);
  }, 40);
}

export function initIntro() {
  if (!shouldPlay()) {
    const root = document.documentElement;
    root.classList.remove("is-intro-pending", "is-intro-in");
    root.removeAttribute("data-intro");
    document.getElementById("intro-stage")?.remove();
    startWebGL();
    return;
  }
  play();
}
