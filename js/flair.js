/* Quiet dual-identity chrome: felt ripples, dealer trail, APM, suit motes */
import { reduced, coarse, isInteractive, atmosphereBlocked, isAtmosphereGrab } from "./pref.js";

const MAX_RIPPLES = 8;
const RIPPLE_MS = 620;

function flairBlocked() {
  return atmosphereBlocked() || isAtmosphereGrab();
}

function ensureLayer() {
  let layer = document.getElementById("flair-layer");
  if (layer) return layer;
  layer = document.createElement("div");
  layer.id = "flair-layer";
  layer.setAttribute("aria-hidden", "true");
  document.body.appendChild(layer);
  return layer;
}

function spawnTemp(el, ms) {
  const layer = ensureLayer();
  layer.appendChild(el);
  window.setTimeout(() => {
    el.remove();
  }, ms);
}

export function initFlair() {
  if (reduced) return;

  const layer = ensureLayer();
  const fineHover =
    typeof matchMedia === "undefined"
      ? !coarse
      : matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ----- Click ripple (room-shaped) ----- */
  function rippleKind() {
    const bg = (document.body.dataset.bg || "").replace(/-v[23]$/, "");
    if (bg === "poker") return "chip";
    if (bg === "2hh" || bg === "badugi" || bg === "play") return "split";
    if (bg === "hero" || bg === "starcraft") return "ping";
    return "ping";
  }

  let rippleCount = 0;
  document.addEventListener(
    "pointerdown",
    (e) => {
      if (flairBlocked()) return;
      if (e.pointerType === "touch" && e.isPrimary === false) return;
      if (isInteractive(e.target)) return;
      if (rippleCount >= MAX_RIPPLES) return;
      const kind = rippleKind();
      const spawnRing = (mod, delay) => {
        const ring = document.createElement("span");
        ring.className = "felt-ripple" + (mod ? " " + mod : "");
        ring.dataset.ripple = kind;
        ring.style.left = e.clientX + "px";
        ring.style.top = e.clientY + "px";
        if (delay) ring.style.animationDelay = delay + "ms";
        rippleCount++;
        spawnTemp(ring, RIPPLE_MS + (delay || 0));
        window.setTimeout(() => {
          rippleCount = Math.max(0, rippleCount - 1);
        }, RIPPLE_MS + (delay || 0));
      };
      if (kind === "chip") {
        spawnRing("felt-ripple--chip", 0);
      } else if (kind === "split") {
        spawnRing("felt-ripple--card felt-ripple--card-a", 0);
        spawnRing("felt-ripple--card felt-ripple--card-b", 0);
      } else {
        spawnRing("felt-ripple--ping", 0);
        spawnRing("felt-ripple--reticle", 40);
      }
    },
    { passive: true }
  );

  /* ----- APM easter egg ----- */
  let meter = document.getElementById("apm-meter");
  if (!meter) {
    meter = document.createElement("div");
    meter.id = "apm-meter";
    document.body.appendChild(meter);
  }
  meter.setAttribute("aria-hidden", "true");
  meter.classList.add("apm-meter");
  if (!meter.querySelector(".apm-meter-label")) {
    meter.innerHTML =
      '<span class="apm-meter-label mono">APM</span> <span class="apm-meter-value mono">0</span>';
  }
  const valueEl = meter.querySelector(".apm-meter-value");

  const clicks = [];
  let hideTimer = 0;
  let tickTimer = 0;
  let unlocked = false;
  const started = performance.now();

  function apmAllowed() {
    if (flairBlocked()) return false;
    if (performance.now() - started < 900) return false;
    if (document.body.dataset.bg === "hero" && !unlocked) return false;
    return true;
  }

  function currentApm() {
    const now = performance.now();
    const windowMs = 2000;
    let n = 0;
    for (let i = clicks.length - 1; i >= 0; i--) {
      if (now - clicks[i] > windowMs) break;
      n++;
    }
    return Math.round((n / 2) * 60);
  }

  function hideMeter() {
    meter.classList.remove("is-on");
    if (tickTimer) {
      clearInterval(tickTimer);
      tickTimer = 0;
    }
  }

  function showMeter() {
    if (!apmAllowed()) return;
    unlocked = true;
    const apm = currentApm();
    if (valueEl) valueEl.textContent = String(apm);
    meter.classList.add("is-on");
    if (!tickTimer) {
      tickTimer = window.setInterval(() => {
        if (valueEl) valueEl.textContent = String(currentApm());
      }, 160);
    }
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = window.setTimeout(hideMeter, 4000);
  }

  function recordPulse(now) {
    clicks.push(now);
    while (clicks.length && now - clicks[0] > 2000) clicks.shift();
    if (clicks.length >= 8) showMeter();
    else if (meter.classList.contains("is-on")) {
      if (valueEl) valueEl.textContent = String(currentApm());
      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = window.setTimeout(hideMeter, 4000);
    }
  }

  document.addEventListener(
    "pointerdown",
    () => {
      if (reduced) return;
      recordPulse(performance.now());
    },
    { passive: true }
  );

  const scrollBursts = [];
  window.addEventListener(
    "wheel",
    (e) => {
      if (flairBlocked()) return;
      if (Math.abs(e.deltaY) < 48) return;
      const now = performance.now();
      scrollBursts.push(now);
      while (scrollBursts.length && now - scrollBursts[0] > 700) scrollBursts.shift();
      if (scrollBursts.length >= 6) {
        for (let i = 0; i < 3; i++) clicks.push(now);
        showMeter();
      }
    },
    { passive: true }
  );

  new MutationObserver(() => {
    if (document.body.classList.contains("play-2hh-immersive")) hideMeter();
  }).observe(document.body, { attributes: true, attributeFilter: ["class"] });

  /* ----- Suit motes on patented-game links ----- */
  if (fineHover) {
    function spawnSuits(anchor) {
      if (flairBlocked()) return;
      const host = anchor.closest("#panel-badugi, #panel-2hh, #innovation, #play");
      const badugi =
        (host && host.id === "panel-badugi") || document.body.dataset.bg === "badugi";
      const glyphs = badugi ? ["♣", "♣", "♠"] : ["♠", "♦", "♠"];
      const rect = anchor.getBoundingClientRect();
      glyphs.forEach((g, i) => {
        const mote = document.createElement("span");
        mote.className = "suit-mote";
        mote.textContent = g;
        const x = rect.left + rect.width * (0.25 + i * 0.25);
        const y = rect.top + rect.height * 0.35;
        mote.style.left = x + "px";
        mote.style.top = y + "px";
        mote.style.setProperty("--suit-drift", (i - 1) * 10 + "px");
        mote.style.animationDelay = i * 0.05 + "s";
        spawnTemp(mote, 700);
      });
    }

    function bindSuit(el) {
      if (!el || el.dataset.suitBound) return;
      el.dataset.suitBound = "1";
      el.addEventListener("pointerenter", () => spawnSuits(el));
      el.addEventListener("focus", () => spawnSuits(el));
    }

    document.querySelectorAll(".suit-hover").forEach(bindSuit);
  }

  layer.dataset.ready = "1";
}
