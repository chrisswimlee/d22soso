/* Tabs, hotkeys, theme, bg crossfade, command nav */
import { reduced } from "./pref.js";

export function measureHeaderHeight() {
  const siteHeader = document.querySelector(".site-header");
  if (!siteHeader) return 64;
  const h = Math.ceil(siteHeader.getBoundingClientRect().height);
  if (h > 0) {
    document.documentElement.style.setProperty("--header-h", h + "px");
    return h;
  }
  return (
    parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 64
  );
}

export function initThemeNav() {
/* ---------- Dynamic background crossfade ---------- */
const bgLayers = [...document.querySelectorAll("#bg-stage .bg-layer")];
let activeBg = document.body.dataset.bg || "starcraft";
let activeSectionId = "hero";
/* Shared with scroll picker so panel clicks aren't undone by the next scroll frame */
let sceneCurrent = null;
/* Ignore center-picking / nav IO while a nav/CTA scroll is in progress */
let navScrollLockUntil = 0;
let navProgrammatic = false;
let ignoreHashChange = false;
let navLockRaf = 0;
let navLockTimer = 0;

function claimSceneSection(section) {
  if (!section) return;
  sceneCurrent = section;
  activeSectionId = section.id;
}

const GAME_VARIANT_KEYS = {
  starcraft: ["starcraft", "starcraft-v2", "starcraft-v3"],
  cnc: ["cnc", "cnc-v2", "cnc-v3"],
  warcraft: ["warcraft", "warcraft-v2", "warcraft-v3"],
  mtg: ["mtg", "mtg-v2", "mtg-v3"],
  hearthstone: ["hearthstone", "hearthstone-v2", "hearthstone-v3"],
};

function accentThemeForBg(bg) {
  /* Hero stays gold-neutral for chrome; theaters keep dialect accents */
  if (bg === "hero") return "hero";
  if (bg === "about" || bg === "contact") return "starcraft";
  return bg;
}

const themeColorMeta = document.querySelector('meta[name="theme-color"]');

function syncThemeColor() {
  if (!themeColorMeta) return;
  if (document.body.dataset.bg === "hero") {
    themeColorMeta.setAttribute("content", "#0a0a0a");
    return;
  }
  const accent = getComputedStyle(document.body).getPropertyValue("--theme-accent").trim();
  if (accent) themeColorMeta.setAttribute("content", accent);
}

/* Match mobile browser chrome to the body theme already set in HTML */
syncThemeColor();

let bgSwitchToken = 0;

function setSceneBg(bgKey, themeKey) {
  const bg = bgKey || "starcraft";
  const theme = themeKey || accentThemeForBg(bg);
  if (bg !== activeBg) {
    const next = bgLayers.find((layer) => layer.dataset.bg === bg);
    /* Prime BEFORE activating so the bitmap exists when opacity starts */
    if (next) next.classList.add("is-primed");

    const token = ++bgSwitchToken;
    const apply = () => {
      if (token !== bgSwitchToken) return;
      activeBg = bg;
      document.body.dataset.bg = bg;
      bgLayers.forEach((layer) => {
        const on = layer.dataset.bg === bg;
        layer.classList.toggle("is-active", on);
        if (on) layer.classList.add("is-primed");
      });
    };

    /* One paint frame after priming avoids empty→image flash on mobile */
    requestAnimationFrame(() => {
      requestAnimationFrame(apply);
    });
  }
  if (document.body.dataset.theme !== theme) {
    document.body.dataset.theme = theme;
  }
  syncThemeColor();
}

let sceneSectionEls = [];

function primeBg(bg) {
  const layer = bgLayers.find((l) => l.dataset.bg === bg);
  if (layer) layer.classList.add("is-primed");
}

function variantKeyForSection(section) {
  const base = section?.dataset.baseTheme;
  const keys = base ? GAME_VARIANT_KEYS[base] : null;
  if (!keys) return null;
  const idx = Math.abs(Number(section.dataset.variant || 0)) % keys.length;
  return keys[idx];
}

function resolveSectionBg(section) {
  if (!section) return "starcraft";
  if (section.hasAttribute("data-bg-from-tab")) {
    const tabRoot = section.querySelector("[data-tabs]");
    const selected = tabRoot?.querySelector('[role="tab"][aria-selected="true"]');
    if (selected?.dataset.theme) return selected.dataset.theme;
  }
  const variantKey = variantKeyForSection(section);
  if (variantKey) return variantKey;
  return section.dataset.bg || "starcraft";
}

function isFinePointer() {
  return typeof matchMedia === "undefined"
    ? true
    : matchMedia("(hover: hover) and (pointer: fine)").matches;
}

function syncThemePips(panel, index) {
  panel.querySelectorAll(".theme-pip").forEach((pip) => {
    const on = Number(pip.dataset.pip) === index;
    pip.classList.toggle("is-active", on);
    if (pip.hasAttribute("aria-pressed")) {
      pip.setAttribute("aria-pressed", on ? "true" : "false");
    }
  });
}

function setupGamePanelThemes() {
  document.querySelectorAll(".game-section .game-panel[data-theme]").forEach((panel) => {
    const section = panel.closest(".game-section");
    const base = section?.dataset.baseTheme;
    const keys = base ? GAME_VARIANT_KEYS[base] : null;
    if (!section || !keys) return;

    function applyVariant(nextIndex) {
      const idx = ((nextIndex % keys.length) + keys.length) % keys.length;
      const key = keys[idx];
      section.dataset.variant = String(idx);
      section.dataset.bg = key;
      section.dataset.theme = key;
      panel.dataset.theme = key;
      syncThemePips(panel, idx);
      document.querySelectorAll(".game-panel.is-theme-active").forEach((el) => {
        if (el !== panel) el.classList.remove("is-theme-active");
      });
      panel.classList.add("is-theme-active");
      claimSceneSection(section);
      setIndicatorLabel(section.id);
      setSceneBg(key, key);
    }

    function cycleVariant() {
      const current = Math.abs(Number(section.dataset.variant || 0)) % keys.length;
      applyVariant(current + 1);
    }

    const pips = panel.querySelector(".theme-pips");
    pips?.addEventListener("click", (e) => {
      const pip = e.target.closest("[data-pip]");
      if (!pip || !pips.contains(pip)) return;
      e.stopPropagation();
      const idx = Number(pip.dataset.pip);
      if (Number.isFinite(idx)) applyVariant(idx);
    });

    panel.addEventListener("click", (e) => {
      if (e.target.closest("a, button, input, textarea, select, canvas, .theme-pips")) return;
      /* Phone: reading the panel must not swap Unsplash. Desktop click-to-cycle stays. */
      if (!isFinePointer()) return;
      cycleVariant();
    });

    panel.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      cycleVariant();
    });

    syncThemePips(panel, Math.abs(Number(section.dataset.variant || 0)) % keys.length);
  });
}

/* Human-readable label for the current-section indicator */
const SECTION_LABELS = {
  hero: "D22-soso",
  about: "About",
  esports: "StarCraft",
  "gaming-archive": "Gaming Archive",
  "gaming-return": "Continue",
  "game-cnc": "Command & Conquer",
  "game-warcraft": "Warcraft",
  "game-mtg": "Magic: The Gathering",
  "game-cube": "Cube Draft",
  "game-hearthstone": "Hearthstone",
  poker: "Poker",
  book: "Betting on Yourself",
  innovation: "Table Game Inventions",
  play: "Play 2 Hand Hold'em",
  locate: "Find 2HH Tables",
  contact: "Contact",
};
const indicatorLabel = document.querySelector("#section-indicator .si-label");

setupGamePanelThemes();

let indicatorFadeTimer = 0;

function setIndicatorLabel(sectionId) {
  if (!indicatorLabel) return;
  const next = SECTION_LABELS[sectionId] || sectionId;
  if (indicatorLabel.textContent === next) return;

  const reducedMotion =
    typeof matchMedia !== "undefined" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reducedMotion) {
    indicatorLabel.textContent = next;
    return;
  }

  indicatorLabel.classList.add("is-swapping");
  if (indicatorFadeTimer) clearTimeout(indicatorFadeTimer);
  indicatorFadeTimer = window.setTimeout(() => {
    indicatorLabel.textContent = next;
    indicatorLabel.classList.remove("is-swapping");
    indicatorFadeTimer = 0;
  }, 120);
}

function applySectionScene(section) {
  if (!section) return;
  activeSectionId = section.id;
  const bg = resolveSectionBg(section);
  setSceneBg(bg, accentThemeForBg(bg));
  const next = sceneSectionEls[sceneSectionEls.indexOf(section) + 1];
  if (next) primeBg(resolveSectionBg(next));
  setIndicatorLabel(section.id);
  const panel = section.querySelector(".game-panel");
  if (panel && section.dataset.baseTheme) {
    const keys = GAME_VARIANT_KEYS[section.dataset.baseTheme];
    const idx = keys
      ? Math.abs(Number(section.dataset.variant || 0)) % keys.length
      : 0;
    syncThemePips(panel, idx);
    document.querySelectorAll(".game-panel.is-theme-active").forEach((el) => {
      el.classList.toggle("is-theme-active", el === panel);
    });
  } else {
    document.querySelectorAll(".game-panel.is-theme-active").forEach((el) => {
      el.classList.remove("is-theme-active");
    });
  }
}

/* Tabs */
function setupTabs(root) {
  const tablist = root.querySelector('[role="tablist"]');
  if (!tablist) return;
  const tabs = [...tablist.querySelectorAll('[role="tab"]')];
  const panels = tabs.map((t) => document.getElementById(t.getAttribute("aria-controls"))).filter(Boolean);
  const hostSection = root.closest("section[data-node]");

  function activate(tab, focus) {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
    });
    panels.forEach((p) => {
      const on = p.id === tab.getAttribute("aria-controls");
      p.hidden = !on;
    });
    const theme = tab.dataset.theme;
    if (theme && hostSection) {
      hostSection.dataset.bg = theme;
      /* Crossfade immediately when this section owns the viewport */
      if (hostSection.id === activeSectionId) {
        setSceneBg(theme, theme);
      }
    } else if (theme) {
      document.body.dataset.theme = theme;
      syncThemeColor();
    }
    if (focus) tab.focus();
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => activate(tab, false));
    tab.addEventListener("keydown", (e) => {
      const i = tabs.indexOf(tab);
      let next = null;
      if (e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
      if (e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
      if (e.key === "Home") next = tabs[0];
      if (e.key === "End") next = tabs[tabs.length - 1];
      if (next) {
        e.preventDefault();
        activate(next, true);
      }
    });
  });

  const selected = tabs.find((t) => t.getAttribute("aria-selected") === "true") || tabs[0];
  activate(selected, false);
}

document.querySelectorAll("[data-tabs]").forEach(setupTabs);

/* Hotkeys 1-5 nav, R roll — clicks use the same scroll path */
const navLinks = [...document.querySelectorAll(".command-nav a[data-hotkey]")];
const brandLink = document.querySelector(".brand[href]");
const commandNav = document.querySelector(".command-nav");
const esportsCluster = document.querySelector("[data-esports-expand]");
const esportsRootSlot = esportsCluster?.querySelector(".nav-esports-root-slot") || null;
const esportsRoot = esportsCluster?.querySelector(".nav-esports-root") || null;
const esportsGames = esportsCluster?.querySelector(".nav-esports-games") || null;
const esportsGamesTrack =
  esportsCluster?.querySelector(".nav-esports-games-track") || null;
const gamesLinks = esportsGames ? [...esportsGames.querySelectorAll("a[href]")] : [];
const siteHeader = document.querySelector(".site-header");
let esportsExpandRaf = 0;
let esportsExpanded = false;
let cachedEsportsRootW = 96;
let cachedEsportsGamesW = 280;

function measureHeaderHeight() {
  if (!siteHeader) return 64;
  const h = Math.ceil(siteHeader.getBoundingClientRect().height);
  if (h > 0) {
    document.documentElement.style.setProperty("--header-h", h + "px");
    return h;
  }
  return (
    parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 64
  );
}

function scrollNavChipIntoView(link) {
  if (!commandNav || !link || !commandNav.contains(link)) return;
  const navRect = commandNav.getBoundingClientRect();
  const linkRect = link.getBoundingClientRect();
  const pad = 6;
  if (linkRect.left >= navRect.left + pad && linkRect.right <= navRect.right - pad) return;
  const delta = linkRect.left - navRect.left - (navRect.width - linkRect.width) / 2;
  commandNav.scrollBy({ left: delta, behavior: "auto" });
}

function resolvePrimaryNavId(sectionId) {
  if (!sectionId || sectionId === "hero") return null;
  if (
    sectionId === "esports" ||
    sectionId === "gaming-archive" ||
    sectionId === "gaming-return" ||
    sectionId.startsWith("game-")
  ) {
    return "esports";
  }
  if (sectionId === "play" || sectionId === "locate") return "innovation";
  if (sectionId === "contact") return "about";
  return sectionId;
}

function isGamesSection(sectionId) {
  /* Theater chips live on gaming.html. Home ESPORTS stays a single item. */
  return (
    sectionId === "gaming-archive" ||
    (!!sectionId && sectionId.startsWith("game-"))
  );
}

function hrefHashId(href) {
  if (!href) return "";
  const i = href.indexOf("#");
  return i >= 0 ? href.slice(i + 1) : "";
}

function refreshEsportsWidthCache(opts) {
  const measureRoot = !opts || opts.root !== false;
  const measureGames = !opts || opts.games !== false;
  if (measureRoot && esportsRoot) {
    cachedEsportsRootW = Math.max(2, Math.ceil(esportsRoot.scrollWidth) + 2);
  }
  if (measureGames && esportsGamesTrack) {
    cachedEsportsGamesW = Math.max(2, Math.ceil(esportsGamesTrack.scrollWidth) + 2);
  }
  return { rootW: cachedEsportsRootW, gamesW: cachedEsportsGamesW };
}

function applyEsportsWidths(inGames, animate) {
  if (!esportsRootSlot || !esportsGames) return;
  const rootW = cachedEsportsRootW;
  const gamesW = cachedEsportsGamesW;

  if (!animate || reduced) {
    esportsRootSlot.style.maxWidth = inGames ? "0px" : rootW + "px";
    esportsGames.style.maxWidth = inGames ? gamesW + "px" : "0px";
    return;
  }

  if (esportsExpandRaf) cancelAnimationFrame(esportsExpandRaf);

  if (inGames) {
    /* Start from open root / closed games, then ease to the reverse */
    esportsRootSlot.style.maxWidth = rootW + "px";
    esportsGames.style.maxWidth = "0px";
    esportsExpandRaf = requestAnimationFrame(() => {
      esportsExpandRaf = requestAnimationFrame(() => {
        esportsExpandRaf = 0;
        esportsRootSlot.style.maxWidth = "0px";
        esportsGames.style.maxWidth = gamesW + "px";
      });
    });
  } else {
    /* Pin open games width first so max-width can ease open→0 */
    esportsGames.style.maxWidth = gamesW + "px";
    esportsRootSlot.style.maxWidth = "0px";
    esportsExpandRaf = requestAnimationFrame(() => {
      esportsExpandRaf = requestAnimationFrame(() => {
        esportsExpandRaf = 0;
        esportsGames.style.maxWidth = "0px";
        esportsRootSlot.style.maxWidth = rootW + "px";
      });
    });
  }
}

function syncEsportsExpand(sectionId) {
  const inGames = isGamesSection(sectionId);
  const stateChanged = inGames !== esportsExpanded;

  if (stateChanged) {
    if (inGames) {
      /* Still showing ESPORTS — cache its width before clipping it shut */
      refreshEsportsWidthCache({ root: true, games: true });
    } else {
      /* Still showing games — cache track width before clipping; keep root cache */
      refreshEsportsWidthCache({ root: false, games: true });
    }
  }

  if (esportsCluster) {
    esportsCluster.classList.toggle("is-expanded", inGames);
  }
  if (esportsRoot) {
    esportsRoot.toggleAttribute("inert", inGames);
    esportsRoot.setAttribute("aria-hidden", inGames ? "true" : "false");
  }
  if (esportsGames) {
    esportsGames.setAttribute("aria-hidden", inGames ? "false" : "true");
    esportsGames.toggleAttribute("inert", !inGames);
  }

  if (stateChanged) {
    esportsExpanded = inGames;
    applyEsportsWidths(inGames, true);
  }

  let activeGameLink = null;
  gamesLinks.forEach((a) => {
    const id = hrefHashId(a.getAttribute("href") || "");
    const on = inGames && sectionId === id;
    a.classList.toggle("is-active", on);
    if (on) {
      a.setAttribute("aria-current", "true");
      activeGameLink = a;
    } else {
      a.removeAttribute("aria-current");
    }
  });
  if (activeGameLink) scrollNavChipIntoView(activeGameLink);
}

/* First paint: lock ESPORTS slot to its real width so collapse has a from-value */
if (esportsRootSlot && esportsGames) {
  const { rootW } = refreshEsportsWidthCache();
  esportsRootSlot.style.maxWidth = rootW + "px";
  esportsGames.style.maxWidth = "0px";
}

function markActiveNav(sectionId) {
  const navId = resolvePrimaryNavId(sectionId);
  const flatGamingNav = !!document.body.dataset.page && document.body.dataset.page === "gaming";
  const onHero = sectionId === "hero" || !sectionId;
  /* Brand is home — never treat gaming sections as “hero active” */
  brandLink?.classList.toggle("is-active", onHero && !flatGamingNav);
  if (onHero && !flatGamingNav) brandLink?.setAttribute("aria-current", "true");
  else brandLink?.removeAttribute("aria-current");

  let activePrimary = null;
  navLinks.forEach((a) => {
    const href = a.getAttribute("href") || "";
    const hashId = hrefHashId(href);
    let on = false;
    if (flatGamingNav) {
      /* Flat theater chips on gaming.html — highlight by section id */
      on = !!(sectionId && hashId === sectionId);
    } else {
      /* Home: highlight ESPORTS while in StarCraft / command; never expand */
      on = !!(navId && href === "#" + navId);
    }
    a.classList.toggle("is-active", on);
    a.style.borderColor = "";
    if (on) {
      a.setAttribute("aria-current", "page");
      activePrimary = a;
    } else {
      a.removeAttribute("aria-current");
    }
  });
  if (activePrimary) scrollNavChipIntoView(activePrimary);
  if (!flatGamingNav && esportsCluster) syncEsportsExpand(sectionId);
}

function endNavLock() {
  navProgrammatic = false;
  navScrollLockUntil = 0;
  if (navLockRaf) {
    cancelAnimationFrame(navLockRaf);
    navLockRaf = 0;
  }
  if (navLockTimer) {
    clearTimeout(navLockTimer);
    navLockTimer = 0;
  }
}

function armNavLock() {
  endNavLock();
  navProgrammatic = true;
  navScrollLockUntil = performance.now() + (reduced ? 80 : 2200);

  const onScrollEnd = () => endNavLock();
  window.addEventListener("scrollend", onScrollEnd, { once: true });

  let lastY = window.scrollY;
  let stable = 0;
  const tick = () => {
    if (!navProgrammatic) return;
    if (Math.abs(window.scrollY - lastY) < 1) {
      stable += 1;
      if (stable >= 10) {
        endNavLock();
        return;
      }
    } else {
      stable = 0;
      lastY = window.scrollY;
    }
    navLockRaf = requestAnimationFrame(tick);
  };
  navLockRaf = requestAnimationFrame(tick);
  navLockTimer = window.setTimeout(endNavLock, reduced ? 120 : 2200);
}

function goToHash(href, pulseEl, opts) {
  if (!href || href === "#") return false;
  const fromHistory = !!(opts && opts.fromHistory);
  const rawId = href.replace(/^#/, "");
  const fromSkip = rawId === "main";
  let target = document.getElementById(fromSkip ? "hero" : rawId);
  if (!target) target = document.getElementById(rawId);
  if (!target) return false;

  /* Keep scroll-margin in sync with the live (possibly wrapped) header */
  measureHeaderHeight();

  const sceneTarget =
    target.tagName === "SECTION" ? target : target.closest("section[id]") || target;

  armNavLock();

  if (sceneTarget?.id) {
    claimSceneSection(sceneTarget);
    markActiveNav(sceneTarget.id);
    applySectionScene(sceneTarget);
  }

  /* Scroll the document element directly — scrollIntoView can target a
     non-moving body scrollport when overflow-x/y compute to auto. */
  const scroller = document.scrollingElement || document.documentElement;
  const top = Math.max(
    0,
    scroller.scrollTop + target.getBoundingClientRect().top - measureHeaderHeight() - 12
  );
  try {
    scroller.scrollTo({
      top,
      left: 0,
      behavior: reduced ? "auto" : "smooth",
    });
  } catch (_) {
    scroller.scrollTop = top;
  }

  const hashId = sceneTarget?.id || target.id || rawId;
  const nextHash = "#" + hashId;
  if (!fromHistory && location.hash !== nextHash) {
    ignoreHashChange = true;
    if (history.pushState) {
      history.pushState(null, "", nextHash);
    } else {
      location.hash = hashId;
    }
    requestAnimationFrame(() => {
      ignoreHashChange = false;
    });
  }

  if (pulseEl) {
    pulseEl.classList.add("pulse");
    setTimeout(() => pulseEl.classList.remove("pulse"), 260);
    scrollNavChipIntoView(pulseEl);
  }

  /* Skip link / #main: move keyboard focus to content */
  if (fromSkip || pulseEl?.classList?.contains("skip-link")) {
    const focusEl = document.getElementById("main") || target;
    if (focusEl) {
      if (!focusEl.hasAttribute("tabindex")) focusEl.tabIndex = -1;
      try {
        focusEl.focus({ preventScroll: true });
      } catch (_) {
        focusEl.focus();
      }
    }
  }

  return true;
}

function onNavActivate(e) {
  const link = e.currentTarget;
  const href = link.getAttribute("href") || "";
  if (!href.startsWith("#")) return;
  e.preventDefault();
  goToHash(href, link);
}

navLinks.forEach((a) => {
  a.addEventListener("click", onNavActivate);
});
brandLink?.addEventListener("click", onNavActivate);
gamesLinks.forEach((a) => {
  a.addEventListener("click", onNavActivate);
});

/* Start the menu at hotkey 1 — flex overflow can leave first chip scrolled out of view */
if (commandNav) {
  commandNav.scrollLeft = 0;
  requestAnimationFrame(() => {
    commandNav.scrollLeft = 0;
  });
}

/* In-page CTA anchors (Play, About, Esports, etc.) */
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  if (a.classList.contains("command-nav") || a.closest(".command-nav") || a === brandLink) {
    return;
  }
  a.addEventListener("click", (e) => {
    const href = a.getAttribute("href") || "";
    if (!href.startsWith("#") || href === "#") return;
    if (!document.getElementById(href.slice(1))) return;
    e.preventDefault();
    goToHash(href, a.closest(".command-nav") ? a : null);
  });
});

window.addEventListener("keydown", (e) => {
  if (e.target.matches("input, textarea, [contenteditable], select")) return;
  if (document.querySelector("dialog[open]")) return;
  const link = navLinks.find((a) => a.dataset.hotkey === e.key);
  if (link) {
    e.preventDefault();
    const href = link.getAttribute("href") || "";
    if (href.startsWith("#")) goToHash(href, link);
    else window.location.assign(href);
  }
});

/* Keyboard help (?), back-to-top, copy email */
(function initSiteChromeExtras() {
  const help = document.getElementById("hotkey-help");
  const helpClose = document.getElementById("hotkey-help-close");
  const backTop = document.getElementById("back-top");
  const copyBtn = document.getElementById("copy-email");
  const EMAIL = copyBtn?.dataset.email || "2handholdem@gmail.com";

  function helpIsOpen() {
    return !!(help && (help.open || help.hasAttribute("open")));
  }

  function openHelp() {
    if (!help) return;
    try {
      if (typeof help.showModal === "function") help.showModal();
      else help.setAttribute("open", "");
    } catch (_) {
      help.setAttribute("open", "");
    }
    helpClose?.focus({ preventScroll: true });
  }

  function closeHelp() {
    if (!help) return;
    try {
      if (typeof help.close === "function" && help.open) help.close();
      else help.removeAttribute("open");
    } catch (_) {
      help.removeAttribute("open");
    }
  }

  function toggleHelp() {
    if (helpIsOpen()) closeHelp();
    else openHelp();
  }

  helpClose?.addEventListener("click", closeHelp);
  help?.addEventListener("click", (e) => {
    if (e.target === help) closeHelp();
  });
  help?.addEventListener("cancel", (e) => {
    e.preventDefault();
    closeHelp();
  });

  window.addEventListener("keydown", (e) => {
    if (e.target.matches("input, textarea, [contenteditable], select")) return;
    if (document.getElementById("feedback-dialog")?.open) return;

    if (e.key === "?" || (e.key === "/" && e.shiftKey)) {
      e.preventDefault();
      toggleHelp();
      return;
    }

    if (e.key === "Escape" && helpIsOpen()) {
      e.preventDefault();
      closeHelp();
    }
  });

  if (backTop) {
    const SHOW_AFTER = 420;
    let backTicking = false;

    function syncBackTop() {
      const show = window.scrollY > SHOW_AFTER;
      backTop.classList.toggle("is-visible", show);
      backTop.setAttribute("aria-hidden", show ? "false" : "true");
      backTop.tabIndex = show ? 0 : -1;
      backTicking = false;
    }

    window.addEventListener(
      "scroll",
      () => {
        if (backTicking) return;
        backTicking = true;
        requestAnimationFrame(syncBackTop);
      },
      { passive: true }
    );
    syncBackTop();

    backTop.addEventListener("click", () => {
      goToHash("#hero", brandLink || null);
    });
  }

  async function copyEmail() {
    if (!copyBtn) return;
    let ok = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(EMAIL);
        ok = true;
      }
    } catch (_) {
      ok = false;
    }
    if (!ok) {
      const ta = document.createElement("textarea");
      ta.value = EMAIL;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      try {
        ok = document.execCommand("copy");
      } catch (_) {
        ok = false;
      }
      document.body.removeChild(ta);
    }

    const label = copyBtn.textContent;
    copyBtn.textContent = ok ? "Copied" : "Copy failed";
    copyBtn.classList.toggle("is-copied", ok);
    copyBtn.setAttribute("aria-live", "polite");
    window.setTimeout(() => {
      copyBtn.textContent = label || "Copy email";
      copyBtn.classList.remove("is-copied");
    }, 1600);
  }

  copyBtn?.addEventListener("click", () => {
    copyEmail();
  });
})();

/* Center-of-viewport section → background theme */
/* Document order must match header: Poker → ESPORTS → Book → Inventions → About */
const sceneSections = [
  "hero",
  "poker",
  "esports",
  "gaming-archive",
  "game-cnc",
  "game-warcraft",
  "game-mtg",
  "game-cube",
  "game-hearthstone",
  "gaming-return",
  "book",
  "innovation",
  "play",
  "locate",
  "about",
  "contact",
]
  .map((id) => document.getElementById(id))
  .filter(Boolean);
sceneSectionEls = sceneSections;

if (sceneSections.length) {
  /* Reading-line picker: last section whose top crossed a line under the
   * header. More stable than nearest-center (less thrash between short theaters). */
  let sceneTicking = false;
  const SCENE_HYSTERESIS_PX = 56;

  function pickCenteredSection() {
    if (navProgrammatic || performance.now() < navScrollLockUntil) return;
    const vh = window.innerHeight || 1;
    const headerH = measureHeaderHeight();
    const probe = headerH + Math.min(Math.max(vh * 0.2, 72), 160);

    let candidate = sceneSections[0];
    for (const el of sceneSections) {
      if (el.getBoundingClientRect().top <= probe) candidate = el;
      else break;
    }

    /* Stick to the current section until the candidate has clearly taken the probe */
    if (sceneCurrent && candidate !== sceneCurrent) {
      const curRect = sceneCurrent.getBoundingClientRect();
      const nextRect = candidate.getBoundingClientRect();
      const currentStillCovers =
        curRect.top < probe && curRect.bottom > probe + SCENE_HYSTERESIS_PX;
      const nextBarelyIn = nextRect.top > probe - SCENE_HYSTERESIS_PX * 0.35;
      if (currentStillCovers && nextBarelyIn) {
        candidate = sceneCurrent;
      }
    }

    if (candidate && candidate !== sceneCurrent) {
      claimSceneSection(candidate);
      applySectionScene(candidate);
      markActiveNav(candidate.id);
    }
  }

  function sceneOnScroll() {
    if (sceneTicking) return;
    sceneTicking = true;
    requestAnimationFrame(() => {
      pickCenteredSection();
      sceneTicking = false;
    });
  }

  window.addEventListener("scroll", sceneOnScroll, { passive: true });
  window.addEventListener("resize", sceneOnScroll, { passive: true });

  /* Initial pick (honor a hash target if present) */
  requestAnimationFrame(() => {
    const hashId = (location.hash || "").replace(/^#/, "");
    const hashEl = hashId ? document.getElementById(hashId) : null;
    if (hashEl && sceneSections.includes(hashEl)) {
      claimSceneSection(hashEl);
      applySectionScene(hashEl);
      markActiveNav(hashEl.id);
    } else {
      pickCenteredSection();
    }
  });

  function onHistoryNav() {
    if (ignoreHashChange) return;
    const id = (location.hash || "").replace(/^#/, "") || "hero";
    goToHash("#" + id, null, { fromHistory: true });
  }
  window.addEventListener("hashchange", onHistoryNav);
  window.addEventListener("popstate", onHistoryNav);
}

}
