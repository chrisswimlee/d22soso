/* Page widgets: hero preview, about fold, poker gallery, 2HH embed, contact */
import { reduced } from "./pref.js";
import { measureHeaderHeight } from "./theme-nav.js";
import { initLocateMap } from "./locate-map.js";

export function initWidgets() {
/* Hero — pillar hover swaps champ plane ↔ WSOP / 2HH emblems in the mid-band */
(function initHeroScenePreview() {
  const hero = document.getElementById("hero");
  const stack = hero?.querySelector(".hero-photo-stack");
  const gate = hero?.querySelector(".hero-gate");
  if (!hero || !gate) return;

  const emblems = [...hero.querySelectorAll(".hero-emblem[data-hero-scene]")];
  const champPhoto = stack?.querySelector(".hero-photo[data-hero-scene='champ']");

  const SCENES = ["champ", "wsop", "2hh"];
  const DEFAULT = "champ";

  let active = hero.dataset.heroActive || DEFAULT;
  let pinned = null;
  let heroVisible = true;

  const fineHover =
    typeof matchMedia === "undefined"
      ? true
      : matchMedia("(hover: hover) and (pointer: fine)").matches;

  function triggerFrom(target) {
    if (!(target instanceof Element)) return null;
    const el = target.closest(".hero-pillar[data-hero-scene]");
    return el && hero.contains(el) ? el : null;
  }

  function syncTriggers(key) {
    hero.querySelectorAll(".hero-pillar[data-hero-scene]").forEach((t) => {
      const on = t.dataset.heroScene === key;
      t.classList.toggle("is-previewing", on);
      t.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function setScene(scene) {
    const key = SCENES.includes(scene) ? scene : DEFAULT;
    active = key;
    hero.dataset.heroActive = key;
    if (stack) stack.dataset.heroActive = key;
    if (champPhoto) champPhoto.classList.toggle("is-active", key === "champ");
    emblems.forEach((el) => {
      el.classList.toggle("is-active", el.dataset.heroScene === key);
    });
    syncTriggers(key);
  }

  function previewFrom(el) {
    if (!heroVisible || !el) return;
    const scene = el.dataset.heroScene;
    if (!scene) return;
    setScene(scene);
  }

  function clearPreview() {
    if (pinned) return;
    setScene(DEFAULT);
  }

  if (fineHover) {
    gate.addEventListener("pointerover", (e) => {
      if (pinned) return;
      const t = triggerFrom(e.target);
      if (!t) return;
      const from = e.relatedTarget;
      if (from instanceof Node && t.contains(from)) return;
      previewFrom(t);
    });

    gate.addEventListener("pointerout", (e) => {
      if (pinned) return;
      const fromTrig = triggerFrom(e.target);
      if (!fromTrig) return;
      const to = e.relatedTarget;
      if (to instanceof Node && fromTrig.contains(to)) return;
      const next = triggerFrom(to);
      if (next) {
        previewFrom(next);
        return;
      }
      clearPreview();
    });

    gate.addEventListener("focusin", (e) => {
      const t = triggerFrom(e.target);
      if (t) previewFrom(t);
    });

    gate.addEventListener("focusout", (e) => {
      if (pinned) return;
      if (triggerFrom(e.relatedTarget)) return;
      clearPreview();
    });
  } else {
    gate.addEventListener("click", (e) => {
      const t = triggerFrom(e.target);
      if (!t) return;
      if (e.target.closest("a[href]")) return;
      if (pinned === t && active === t.dataset.heroScene) {
        pinned = null;
        setScene(DEFAULT);
        return;
      }
      pinned = t;
      previewFrom(t);
    });

    window.addEventListener(
      "scroll",
      () => {
        if (!pinned) return;
        pinned = null;
        setScene(DEFAULT);
      },
      { passive: true }
    );
  }

  if (typeof IntersectionObserver !== "undefined") {
    const leaveObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          heroVisible = entry.isIntersecting;
          if (!entry.isIntersecting) {
            pinned = null;
            setScene(DEFAULT);
          }
        });
      },
      { threshold: 0.15 }
    );
    leaveObs.observe(hero);
  }

  setScene(DEFAULT);
})();

/* About — animate “Read the full story” expand / collapse */
(function () {
  const details = document.querySelector("details.about-more");
  const panel = details?.querySelector(".about-more-content");
  const summary = details?.querySelector("summary");
  const label = summary?.querySelector(".about-more-label");
  if (!details || !panel || !summary) return;

  details.classList.add("is-js-collapse");
  let busy = false;
  const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
  const OPEN_MS = reduced ? 0 : 480;
  const CLOSE_MS = reduced ? 0 : 360;

  function syncAboutLabel() {
    if (label) {
      label.textContent = details.open ? "Collapse story" : "Read the full story";
    }
    summary.setAttribute("aria-expanded", details.open ? "true" : "false");
  }

  function clearInline() {
    panel.style.height = "";
    panel.style.opacity = "";
    panel.style.transition = "";
  }

  function openAnimated() {
    if (busy) return;
    busy = true;
    details.open = true;
    syncAboutLabel();
    details.classList.add("is-animating", "is-opening");
    details.classList.remove("is-closing");
    if (reduced) {
      details.classList.remove("is-animating", "is-opening");
      clearInline();
      busy = false;
      return;
    }
    panel.style.height = "0px";
    panel.style.opacity = "0";
    void panel.offsetHeight;
    panel.style.transition =
      "height " + OPEN_MS + "ms " + EASE + ", opacity " + Math.round(OPEN_MS * 0.7) + "ms ease";
    panel.style.height = panel.scrollHeight + "px";
    panel.style.opacity = "1";
    window.setTimeout(() => {
      panel.style.height = "auto";
      panel.style.transition = "";
      panel.style.opacity = "";
      details.classList.remove("is-animating");
      window.setTimeout(() => {
        details.classList.remove("is-opening");
        busy = false;
      }, 360);
    }, OPEN_MS);
  }

  function closeAnimated() {
    if (busy || !details.open) return;
    busy = true;
    details.classList.add("is-animating", "is-closing");
    details.classList.remove("is-opening");
    if (reduced) {
      details.open = false;
      syncAboutLabel();
      details.classList.remove("is-animating", "is-closing");
      clearInline();
      busy = false;
      return;
    }
    panel.style.height = panel.scrollHeight + "px";
    panel.style.opacity = "1";
    void panel.offsetHeight;
    panel.style.transition =
      "height " + CLOSE_MS + "ms " + EASE + ", opacity " + Math.round(CLOSE_MS * 0.75) + "ms ease";
    panel.style.height = "0px";
    panel.style.opacity = "0";
    window.setTimeout(() => {
      details.open = false;
      syncAboutLabel();
      details.classList.remove("is-animating", "is-closing");
      clearInline();
      busy = false;
    }, CLOSE_MS);
  }

  syncAboutLabel();
  summary.addEventListener("click", (e) => {
    e.preventDefault();
    if (busy) return;
    if (details.open) closeAnimated();
    else openAnimated();
  });
})();

/* Poker gallery — hover/focus a block to swap the featured photo */
(function () {
  const gallery = document.querySelector("[data-poker-gallery]");
  const img = document.getElementById("poker-photo-img");
  if (!gallery || !img) return;
  const caption = gallery.querySelector(".poker-photo-caption");
  const triggers = [...gallery.querySelectorAll("[data-swap-img]")];
  const defSrc = img.dataset.default || img.getAttribute("src");
  const defAlt = img.dataset.defaultAlt || img.getAttribute("alt");
  const defPos = img.dataset.defaultPos || "50% 28%";
  const defFit = img.dataset.defaultFit || "cover";
  const defCap = caption ? caption.textContent : "";
  let applied = defSrc;
  let fadeTimer = null;
  let leaveTimer = null;
  let loadToken = 0;
  let activeTrigger = null;
  let pinned = null;

  function sameSrc(a, b) {
    if (!a || !b) return false;
    if (a === b) return true;
    try {
      return new URL(a, location.href).href === new URL(b, location.href).href;
    } catch (_) {
      return a === b;
    }
  }

  const cache = new Map();
  function prefetch(src) {
    if (!src || cache.has(src)) return cache.get(src);
    const pre = new Image();
    pre.decoding = "async";
    pre.src = src;
    cache.set(src, pre);
    return pre;
  }

  function applyFit(fit) {
    img.classList.toggle("is-contain", fit === "contain");
  }

  function applyFrame(next) {
    const token = ++loadToken;
    if (sameSrc(next.src, applied)) {
      img.style.objectPosition = next.pos;
      applyFit(next.fit);
      if (next.alt) img.alt = next.alt;
      if (caption && next.cap) caption.textContent = next.cap;
      img.classList.remove("is-swapping");
      return;
    }

    img.classList.add("is-swapping");
    clearTimeout(fadeTimer);

    const paint = () => {
      if (token !== loadToken) return;
      applied = next.src;
      img.style.objectPosition = next.pos;
      applyFit(next.fit);
      img.src = next.src;
      if (next.alt) img.alt = next.alt;
      if (caption && next.cap) caption.textContent = next.cap;
      const finish = () => {
        if (token !== loadToken) return;
        img.classList.remove("is-swapping");
      };
      if (typeof img.decode === "function") {
        img.decode().then(finish).catch(finish);
      } else {
        requestAnimationFrame(finish);
      }
    };

    fadeTimer = setTimeout(() => {
      const pre = prefetch(next.src);
      if (pre && pre.complete) {
        paint();
        return;
      }
      pre.onload = paint;
      pre.onerror = paint;
    }, 120);
  }

  function frameFrom(t) {
    if (!t) {
      return { src: defSrc, alt: defAlt, cap: defCap, pos: defPos, fit: defFit };
    }
    return {
      src: t.getAttribute("data-swap-img"),
      alt: t.getAttribute("data-swap-alt") || "",
      cap: t.getAttribute("data-swap-caption") || "",
      pos: t.getAttribute("data-swap-pos") || defPos,
      fit: t.getAttribute("data-swap-fit") || defFit,
    };
  }

  function setSelected(t) {
    triggers.forEach((el) => el.classList.toggle("is-selected", el === t));
  }

  function showTrigger(t) {
    if (!t) return;
    activeTrigger = t;
    clearTimeout(leaveTimer);
    setSelected(t);
    applyFrame(frameFrom(t));
  }

  function clearTrigger(t) {
    if (pinned) return;
    if (activeTrigger !== t) return;
    activeTrigger = null;
    clearTimeout(leaveTimer);
    leaveTimer = setTimeout(() => {
      if (activeTrigger || pinned) return;
      setSelected(null);
      applyFrame(frameFrom(null));
    }, 160);
  }

  function isTouchPreview() {
    return (
      (typeof matchMedia !== "undefined" && matchMedia("(pointer: coarse)").matches) ||
      (typeof matchMedia !== "undefined" && matchMedia("(hover: none)").matches)
    );
  }

  triggers.forEach((t) => {
    t.addEventListener("mouseenter", () => {
      if (pinned) return;
      showTrigger(t);
    });
    t.addEventListener("mouseleave", () => clearTrigger(t));
    t.addEventListener("focusin", () => {
      if (pinned) return;
      showTrigger(t);
    });
    t.addEventListener("focusout", (e) => {
      if (t.contains(e.relatedTarget)) return;
      clearTrigger(t);
    });
    t.addEventListener("click", (e) => {
      if (!isTouchPreview()) return;
      e.preventDefault();
      if (pinned === t) {
        pinned = null;
        activeTrigger = null;
        setSelected(null);
        applyFrame(frameFrom(null));
        return;
      }
      pinned = t;
      showTrigger(t);
    });
  });
})();

/* In-page 2HH game embed — native table is fixed 1000×665 with ~120px host chrome above it */
const playWrap = document.getElementById("play-2hh-wrap");
const playScaler = document.getElementById("play-2hh-scaler");
const playFrame = document.getElementById("play-2hh-frame");
const playStart = document.getElementById("play-2hh-start");
const playFs = document.getElementById("play-2hh-fs");
const playCenter = document.getElementById("play-2hh-center");
const playExitImmersive = document.getElementById("play-2hh-exit-immersive");
const playSectionEl = document.getElementById("play");
const playCtas = playSectionEl?.querySelector(".play-ctas");
const PLAY_NATIVE_W = 1000;
const PLAY_NATIVE_H = 665;
const PLAY_CROP_TOP = 128;
let playSyncRaf = 0;

function canFullscreen(el) {
  return !!(
    el &&
    (el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen) &&
    document.fullscreenEnabled !== false
  );
}

function playNeedsImmersive() {
  if (typeof matchMedia === "undefined") return false;
  return (
    matchMedia("(max-width: 900px)").matches ||
    matchMedia("(max-height: 700px)").matches ||
    matchMedia("(orientation: portrait) and (max-width: 1024px)").matches
  );
}

function playViewMetrics() {
  const vv = window.visualViewport;
  return {
    viewW: Math.max(1, vv?.width || window.innerWidth || 1),
    viewH: Math.max(1, vv?.height || window.innerHeight || 1),
    viewTop: vv?.offsetTop || 0,
    viewLeft: vv?.offsetLeft || 0,
  };
}

function applyPlayScale(availW, availH) {
  if (!playWrap) return 1;
  const pad = playWrap.classList.contains("is-immersive") ? 16 : 0;
  const scale = Math.max(
    0.2,
    Math.min((availW - pad) / PLAY_NATIVE_W, (availH - pad) / PLAY_NATIVE_H)
  );
  playWrap.style.setProperty("--play-native-w", String(PLAY_NATIVE_W));
  playWrap.style.setProperty("--play-native-h", String(PLAY_NATIVE_H));
  playWrap.style.setProperty("--play-crop-top", PLAY_CROP_TOP + "px");
  playWrap.style.setProperty("--play-scale", String(scale));
  if (playScaler) {
    playScaler.style.width = PLAY_NATIVE_W + "px";
    playScaler.style.height = PLAY_NATIVE_H + "px";
  }
  return scale;
}

function syncPlayChrome() {
  if (!playWrap || !playSectionEl) return;

  const { viewW, viewH } = playViewMetrics();
  const immersive = playWrap.classList.contains("is-immersive");
  const live = playWrap.classList.contains("is-live");

  if (immersive) {
    applyPlayScale(viewW, viewH);
    playWrap.style.width = "100%";
    playWrap.style.height = "100%";
    playWrap.style.maxWidth = "none";
    playWrap.style.maxHeight = "none";
    playWrap.style.aspectRatio = "auto";
    return;
  }

  const headerH = measureHeaderHeight();
  const safeBottom =
    parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--safe-bottom")) || 0;
  const ctasVisible =
    live && playCtas && getComputedStyle(playCtas).display !== "none" &&
    getComputedStyle(playCtas).visibility !== "hidden";
  const rawCtasH = ctasVisible ? playCtas.getBoundingClientRect().height : 0;
  const mobile = typeof matchMedia !== "undefined" && matchMedia("(max-width: 768px)").matches;
  const ctasH = Math.min(rawCtasH, mobile ? 52 : 96);
  const panelPad = live ? 8 : 24;
  const availH = Math.max(220, viewH - headerH - ctasH - safeBottom - panelPad - 12);
  const panel = playSectionEl.querySelector(".play-panel-wide");
  const panelW = panel ? panel.getBoundingClientRect().width : viewW;
  const availW = Math.max(220, Math.min(panelW || viewW, viewW) - (live ? 8 : 24));

  const scale = applyPlayScale(availW, availH);
  const fittedW = Math.floor(PLAY_NATIVE_W * scale);
  const fittedH = Math.floor(PLAY_NATIVE_H * scale);

  if (!live) {
    playWrap.style.removeProperty("width");
    playWrap.style.removeProperty("height");
    playWrap.style.removeProperty("max-width");
    playWrap.style.removeProperty("max-height");
    playWrap.style.aspectRatio = PLAY_NATIVE_W + " / " + PLAY_NATIVE_H;
    return;
  }

  playWrap.style.width = fittedW + "px";
  playWrap.style.height = fittedH + "px";
  playWrap.style.maxWidth = "100%";
  playWrap.style.maxHeight = fittedH + "px";
  playWrap.style.aspectRatio = "auto";
}

function schedulePlaySync() {
  if (playSyncRaf) cancelAnimationFrame(playSyncRaf);
  playSyncRaf = requestAnimationFrame(() => {
    playSyncRaf = 0;
    syncPlayChrome();
  });
}

function centerPlayTable() {
  if (!playWrap || !playSectionEl) return;
  syncPlayChrome();

  const { viewH, viewTop } = playViewMetrics();
  const headerH = measureHeaderHeight();
  const ctasVisible =
    playCtas &&
    getComputedStyle(playCtas).display !== "none" &&
    getComputedStyle(playCtas).visibility !== "hidden";
  const ctasH = ctasVisible ? Math.min(playCtas.getBoundingClientRect().height, 96) : 0;
  const bandTop = headerH + 6;
  const bandH = Math.max(180, viewH - bandTop - ctasH - 10);
  const wrapH = playWrap.getBoundingClientRect().height || PLAY_NATIVE_H;
  const desiredTopInView = bandTop + Math.max(0, (bandH - wrapH) / 2);

  const scroller = document.scrollingElement || document.documentElement;
  const wrapDocTop = scroller.scrollTop + playWrap.getBoundingClientRect().top - viewTop;
  const nextTop = Math.max(0, Math.round(wrapDocTop - desiredTopInView));

  try {
    scroller.scrollTo({
      top: nextTop,
      left: 0,
      behavior: reduced ? "auto" : "smooth",
    });
  } catch (_) {
    scroller.scrollTop = nextTop;
  }

  window.setTimeout(syncPlayChrome, reduced ? 40 : 320);
}

function setImmersive(on) {
  if (!playWrap) return;
  playWrap.classList.toggle("is-immersive", on);
  document.body.classList.toggle("play-2hh-immersive", on);
  if (playExitImmersive) {
    const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
    const inNativeFs = !!(fsEl && (fsEl === playWrap || playWrap.contains(fsEl)));
    playExitImmersive.hidden = !on || inNativeFs;
    if (on && !inNativeFs) {
      try {
        playExitImmersive.focus({ preventScroll: true });
      } catch (_) {
        playExitImmersive.focus();
      }
    }
  }
  if (on) {
    try {
      playFrame?.blur();
    } catch (_) {
      /* ignore */
    }
  }
  syncPlayChrome();
}

function showPlayFrameFs(show) {
  if (!playFs) return;
  playFs.hidden = !show;
}

function launch2HH() {
  if (!playFrame || !playWrap) return;
  if (!playFrame.getAttribute("src")) {
    playFrame.src = playFrame.getAttribute("data-src") || "https://play2hh.herokuapp.com/";
  }
  playFrame.setAttribute("scrolling", "no");
  playWrap.classList.add("is-live");
  playSectionEl?.classList.add("is-playing");
  document.body.classList.add("play-2hh-live");
  showPlayFrameFs(true);

  /* Phones / short viewports: lock the table to the full screen immediately */
  if (playNeedsImmersive()) {
    setImmersive(true);
  }

  syncPlayChrome();
  requestAnimationFrame(() => {
    if (!playWrap.classList.contains("is-immersive")) {
      centerPlayTable();
    }
    requestAnimationFrame(syncPlayChrome);
    window.setTimeout(syncPlayChrome, reduced ? 40 : 320);
  });
}

if (playWrap) {
playStart?.addEventListener("click", launch2HH);
playCenter?.addEventListener("click", () => {
  if (playNeedsImmersive()) {
    setImmersive(true);
    return;
  }
  centerPlayTable();
});
playExitImmersive?.addEventListener("click", () => {
  setImmersive(false);
  requestAnimationFrame(() => {
    syncPlayChrome();
    centerPlayTable();
  });
});

if (playFs && playWrap && !canFullscreen(playWrap)) {
  playFs.textContent = "Expand table";
}
showPlayFrameFs(!!playSectionEl?.classList.contains("is-playing"));

/* Re-center once the live table finishes loading — the frame's content can
   shift the wrap after the initial launch centering pass */
playFrame?.addEventListener("load", () => {
  if (!playWrap?.classList.contains("is-live")) return;
  syncPlayChrome();
  if (!playWrap.classList.contains("is-immersive")) centerPlayTable();
});

playFs?.addEventListener("click", () => {
  launch2HH();
  const target = playWrap;
  if (!target) return;
  const req =
    target.requestFullscreen ||
    target.webkitRequestFullscreen ||
    target.msRequestFullscreen;
  if (req && canFullscreen(target)) {
    Promise.resolve(req.call(target))
      .then(() => {
        setImmersive(true);
        if (playExitImmersive) playExitImmersive.hidden = true;
        syncPlayChrome();
      })
      .catch(() => setImmersive(true));
    return;
  }
  /* iOS Safari / unsupported: CSS immersive fallback */
  setImmersive(true);
});

window.addEventListener("resize", schedulePlaySync, { passive: true });
window.addEventListener("orientationchange", () => {
  window.setTimeout(schedulePlaySync, 120);
  window.setTimeout(() => {
    if (!playWrap?.classList.contains("is-live")) {
      schedulePlaySync();
      return;
    }
    if (playNeedsImmersive()) setImmersive(true);
    else if (!playWrap.classList.contains("is-immersive")) centerPlayTable();
    else schedulePlaySync();
  }, 280);
});
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", schedulePlaySync, { passive: true });
  window.visualViewport.addEventListener(
    "scroll",
    () => {
      if (playWrap?.classList.contains("is-live")) schedulePlaySync();
    },
    { passive: true }
  );
}

function onFullscreenChange() {
  const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
  if (fsEl && (fsEl === playWrap || playWrap?.contains(fsEl))) {
    setImmersive(true);
    if (playExitImmersive) playExitImmersive.hidden = true;
    syncPlayChrome();
    return;
  }
  if (!fsEl && playWrap?.classList.contains("is-live")) {
    if (playNeedsImmersive()) setImmersive(true);
    else setImmersive(false);
    schedulePlaySync();
  }
}
document.addEventListener("fullscreenchange", onFullscreenChange);
document.addEventListener("webkitfullscreenchange", onFullscreenChange);

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape" || !playWrap?.classList.contains("is-immersive")) return;
  if (document.querySelector("dialog[open]")) return;
  const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
  if (fsEl && (fsEl === playWrap || playWrap.contains(fsEl))) {
    const exit = document.exitFullscreen || document.webkitExitFullscreen;
    if (exit) Promise.resolve(exit.call(document)).catch(() => setImmersive(false));
    else setImmersive(false);
    return;
  }
  setImmersive(false);
  if (playWrap.classList.contains("is-live")) requestAnimationFrame(centerPlayTable);
});

/* Leave table lock when navigating to another section */
document.querySelectorAll('.site-nav a[href^="#"], a[href^="#"]').forEach((a) => {
  a.addEventListener("click", () => {
    const href = a.getAttribute("href") || "";
    if (href === "#play" || href === "#main") return;
    if (playWrap?.classList.contains("is-immersive")) setImmersive(false);
  });
});

syncPlayChrome();
}

/* Site feedback — mailto with date, version, and optional bug report */
(function initFeedback() {
  const FEEDBACK_TO = "200percentooak@gmail.com";
  const SITE_VERSION =
    document.querySelector('meta[name="d22soso-version"]')?.getAttribute("content")?.trim() ||
    "2026.08.28";

  const trigger = document.getElementById("feedback-open");
  const dialog = document.getElementById("feedback-dialog");
  const form = document.getElementById("feedback-form");
  const cancel = document.getElementById("feedback-cancel");
  const dateEl = document.getElementById("feedback-date");
  const versionEl = document.getElementById("feedback-version");
  const messageEl = document.getElementById("feedback-message");
  if (!trigger && !dialog) return;

  function todayStamp() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return yyyy + "-" + mm + "-" + dd;
  }

  function buildMailto(kind, message) {
    const date = todayStamp();
    const label = kind === "bug" ? "bug" : "feedback";
    const subject = "d22soso " + label + " · " + date + " · v" + SITE_VERSION;
    const body = [
      "Date: " + date,
      "Version: " + SITE_VERSION,
      "Page: " + (location.href || ""),
      "Type: " + (kind === "bug" ? "Bug" : "Feedback"),
      "",
      (message || "").trim() || "(no description)",
    ].join("\n");
    return (
      "mailto:" +
      FEEDBACK_TO +
      "?subject=" +
      encodeURIComponent(subject) +
      "&body=" +
      encodeURIComponent(body)
    );
  }

  function syncFallbackHref() {
    if (!trigger) return;
    trigger.setAttribute("href", buildMailto("feedback", ""));
  }

  function fillMeta() {
    if (dateEl) dateEl.textContent = todayStamp();
    if (versionEl) versionEl.textContent = SITE_VERSION;
  }

  function openDialog() {
    if (!dialog) return;
    fillMeta();
    try {
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    } catch (_) {
      dialog.setAttribute("open", "");
    }
    messageEl?.focus({ preventScroll: true });
  }

  function closeDialog() {
    if (!dialog) return;
    try {
      if (typeof dialog.close === "function" && dialog.open) dialog.close();
      else dialog.removeAttribute("open");
    } catch (_) {
      dialog.removeAttribute("open");
    }
  }

  syncFallbackHref();
  fillMeta();

  trigger?.addEventListener("click", (e) => {
    syncFallbackHref();
    if (dialog && typeof dialog.showModal === "function") {
      e.preventDefault();
      openDialog();
    }
  });

  cancel?.addEventListener("click", () => closeDialog());

  dialog?.addEventListener("click", (e) => {
    if (e.target === dialog) closeDialog();
  });

  dialog?.addEventListener("close", () => {
    trigger?.focus({ preventScroll: true });
  });

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const kind =
      form.querySelector('input[name="feedback-kind"]:checked')?.value || "feedback";
    const message = (messageEl?.value || "").trim();
    if (!message) {
      messageEl?.focus();
      return;
    }
    const href = buildMailto(kind, message);
    closeDialog();
    window.location.href = href;
  });
})();

initLocateMap();

}
