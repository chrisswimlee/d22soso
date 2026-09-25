/* Homepage intro: a short fade on every visit to the default page. The hero photo does not move. */
import { reduced, coarse } from "./pref.js";
import { startWebGL } from "./webgl-boot.js";

const SKY_PARTS = ["card", "lockup", "rest"];

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

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

function isDeepLink() {
  const hash = location.hash || "";
  return hash !== "" && hash !== "#" && hash !== "#hero";
}

function shouldPlay() {
  return !(
    reduced ||
    isDeepLink() ||
    !hasWebGL() ||
    !document.getElementById("webgl-bg") ||
    !document.getElementById("hero")
  );
}

function clearPending() {
  document.documentElement.classList.remove("is-intro-pending", "is-intro-revealing");
  document.documentElement.removeAttribute("data-intro");
}

function revealPart(id) {
  document.querySelectorAll(`[data-sky-part="${id}"]`).forEach((el) => {
    el.classList.add("is-sky-in");
  });
}

function revealAllParts() {
  SKY_PARTS.forEach(revealPart);
}

function revealHero() {
  revealAllParts();
  document.documentElement.classList.add("is-intro-revealing");
  document.documentElement.classList.remove("is-intro-pending");
}

function finishStage() {
  const stage = document.getElementById("intro-stage");
  stage?.remove();
  clearPending();
}

function endIntro({ skipSky = true } = {}) {
  if (finished) return;
  finished = true;
  if (watchdog) {
    clearTimeout(watchdog);
    watchdog = 0;
  }
  runCleanups();
  if (skipSky) sceneApi?.skipSkyIntro?.();
  revealHero();
  finishStage();
}

function bindSkip() {
  const stage = document.getElementById("intro-stage");
  const skipBtn = stage?.querySelector(".intro-skip");
  const skip = () => endIntro({ skipSky: true });
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

  const blockScroll = (e) => e.preventDefault();
  document.addEventListener("wheel", blockScroll, { passive: false });
  document.addEventListener("touchmove", blockScroll, { passive: false });
  onClean(() => {
    document.removeEventListener("wheel", blockScroll);
    document.removeEventListener("touchmove", blockScroll);
  });
}

async function play() {
  const root = document.documentElement;
  const stage = document.getElementById("intro-stage");
  const skipBtn = stage?.querySelector(".intro-skip");
  if (!stage) {
    endIntro();
    return;
  }

  root.classList.add("is-intro-pending");
  root.setAttribute("data-intro", "playing");
  stage.hidden = false;
  if (skipBtn) skipBtn.hidden = false;

  bindSkip();
  watchdog = setTimeout(() => endIntro({ skipSky: true }), coarse ? 7000 : 10000);

  try {
    sceneApi = await startWebGL({ immediate: true });
  } catch {
    endIntro({ skipSky: false });
    startWebGL();
    return;
  }

  if (finished) return;

  if (!sceneApi?.playSkyIntro) {
    endIntro({ skipSky: false });
    return;
  }

  sceneApi.playSkyIntro({
    onRevealPart: revealPart,
    onReveal: revealHero,
    onDone: () => {
      if (finished) return;
      finished = true;
      if (watchdog) {
        clearTimeout(watchdog);
        watchdog = 0;
      }
      runCleanups();
      revealHero();
      finishStage();
    },
  });
}

export function initIntro() {
  if (!shouldPlay()) {
    clearPending();
    document.getElementById("intro-stage")?.remove();
    startWebGL();
    return;
  }
  play().catch(() => {
    endIntro({ skipSky: false });
    startWebGL();
  });
}
