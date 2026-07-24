/* Orchestration: tabs, hotkeys, theme, WebGL boot, bg crossfade */
import { initBgScene } from "./js/webgl-scene.js";
import { D22Canvas as C } from "./js/webgl-interactives.js";

const reduced =
  typeof matchMedia !== "undefined" &&
  matchMedia("(prefers-reduced-motion: reduce)").matches;

(function () {
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
    if (bg === "about" || bg === "contact" || bg === "hero") return "starcraft";
    return bg;
  }

  const themeColorMeta = document.querySelector('meta[name="theme-color"]');

  function syncThemeColor() {
    if (!themeColorMeta) return;
    const accent = getComputedStyle(document.body).getPropertyValue("--theme-accent").trim();
    if (accent) themeColorMeta.setAttribute("content", accent);
  }

  /* Match mobile browser chrome to the body theme already set in HTML */
  syncThemeColor();

  function setSceneBg(bgKey, themeKey) {
    const bg = bgKey || "starcraft";
    const theme = themeKey || accentThemeForBg(bg);
    if (bg !== activeBg) {
      activeBg = bg;
      document.body.dataset.bg = bg;
      bgLayers.forEach((layer) => {
        layer.classList.toggle("is-active", layer.dataset.bg === bg);
      });
    }
    if (document.body.dataset.theme !== theme) {
      document.body.dataset.theme = theme;
    }
    syncThemeColor();
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

  function syncThemePips(panel, index) {
    panel.querySelectorAll(".theme-pip").forEach((pip, i) => {
      pip.classList.toggle("is-active", i === index);
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

      panel.addEventListener("click", (e) => {
        if (e.target.closest("a, button, input, textarea, select")) return;
        /* Race / card canvases capture their own input; battle map still cycles theme */
        const canvas = e.target.closest("canvas");
        if (canvas && canvas.id !== "battle-canvas") return;
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
    "game-cnc": "Command & Conquer",
    "game-warcraft": "Warcraft",
    "game-mtg": "Magic: The Gathering",
    "game-cube": "Cube Draft",
    "game-hearthstone": "Hearthstone",
    poker: "Poker",
    book: "Betting on Yourself",
    innovation: "Casino Innovation",
    play: "Play 2 Hand Hold'em",
    locate: "Find 2HH Tables",
    contact: "Comms",
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
  const gamesLinks = esportsGames ? [...esportsGames.querySelectorAll("a[href^='#']")] : [];
  const siteHeader = document.querySelector(".site-header");
  let raceApi = null;
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
    if (sectionId === "esports" || sectionId.startsWith("game-")) return "esports";
    if (sectionId === "play" || sectionId === "locate") return "innovation";
    if (sectionId === "contact") return "about";
    return sectionId;
  }

  function isGamesSection(sectionId) {
    return sectionId === "esports" || (!!sectionId && sectionId.startsWith("game-"));
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
      const id = (a.getAttribute("href") || "").replace(/^#/, "");
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
    const inGames = isGamesSection(sectionId);
    const onHero = sectionId === "hero" || !sectionId;
    brandLink?.classList.toggle("is-active", onHero);
    if (onHero) brandLink?.setAttribute("aria-current", "true");
    else brandLink?.removeAttribute("aria-current");

    let activePrimary = null;
    navLinks.forEach((a) => {
      /* While expanded, ESPORTS root is hidden — games chips carry the highlight */
      const on = !inGames && !!(navId && a.getAttribute("href") === "#" + navId);
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
    syncEsportsExpand(sectionId);
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

    /* Leave CSS-immersive table before jumping elsewhere */
    const immersiveWrap = document.getElementById("play-2hh-wrap");
    if (immersiveWrap?.classList.contains("is-immersive") && typeof setImmersive === "function") {
      setImmersive(false);
    }

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
    if (e.target.matches("input, textarea, [contenteditable]")) return;
    const link = navLinks.find((a) => a.dataset.hotkey === e.key);
    if (link) {
      e.preventDefault();
      goToHash(link.getAttribute("href"), link);
    }
    if (e.key === "r" || e.key === "R") {
      raceApi?.roll();
    }
  });

  /* Keyboard help (?), back-to-top, copy email */
  (function initSiteChromeExtras() {
    const help = document.getElementById("hotkey-help");
    const helpClose = document.getElementById("hotkey-help-close");
    const backTop = document.getElementById("back-top");
    const copyBtn = document.getElementById("copy-email");
    const EMAIL = "playbadugi@gmail.com";

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
      if (e.target.matches("input, textarea, [contenteditable]")) return;

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
    "game-cnc",
    "game-warcraft",
    "game-mtg",
    "game-cube",
    "game-hearthstone",
    "book",
    "innovation",
    "play",
    "locate",
    "about",
    "contact",
  ]
    .map((id) => document.getElementById(id))
    .filter(Boolean);

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

  /* Boot WebGL systems (Three.js + GSAP) */
  initBgScene(document.getElementById("webgl-bg"));
  raceApi = C.initRaceRoll(document.getElementById("race-canvas"));
  C.initBattleMap(document.getElementById("battle-canvas"));
  C.init2HH(document.getElementById("cards-2hh"));
  C.initBadugi(document.getElementById("cards-badugi"));

  /* Hero panels — hover/focus/tap previews matching feature backgrounds */
  (function initHeroPanelBgPreview() {
    const root = document.querySelector(".hero-panels");
    const stage = document.getElementById("bg-stage");
    if (!root) return;

    const SCENE_BY_PANEL = {
      champion: { bg: "starcraft", theme: "starcraft" },
      inventor: { bg: "2hh", theme: "2hh" },
      media: { bg: "poker", theme: "poker" },
    };

    let previewActive = false;
    const fineHover =
      typeof matchMedia !== "undefined" &&
      matchMedia("(hover: hover) and (pointer: fine)").matches;

    function setPreviewing(on) {
      previewActive = on;
      stage?.classList.toggle("is-hero-preview", on);
    }

    function previewPanel(panel) {
      if (activeSectionId !== "hero" || !panel) return;
      const scene = SCENE_BY_PANEL[panel.dataset.panel];
      if (!scene) return;
      setPreviewing(true);
      setSceneBg(scene.bg, scene.theme);
    }

    function clearPreview() {
      if (!previewActive) return;
      setPreviewing(false);
      if (activeSectionId !== "hero") return;
      setSceneBg("hero", "starcraft");
    }

    if (fineHover) {
      root.addEventListener("pointerover", (e) => {
        const panel = e.target.closest(".hero-panel");
        if (!panel || !root.contains(panel)) return;
        const from = e.relatedTarget;
        if (from && panel.contains(from)) return;
        previewPanel(panel);
      });

      root.addEventListener("pointerout", (e) => {
        const to = e.relatedTarget;
        if (to && root.contains(to)) {
          const nextPanel = to.closest?.(".hero-panel");
          if (nextPanel && root.contains(nextPanel)) {
            previewPanel(nextPanel);
            return;
          }
        }
        clearPreview();
      });
    } else {
      /* Touch: preview on press; clear when leaving hero or scrolling away */
      root.addEventListener(
        "pointerdown",
        (e) => {
          const panel = e.target.closest(".hero-panel");
          if (!panel || !root.contains(panel)) return;
          previewPanel(panel);
        },
        { passive: true }
      );
      window.addEventListener(
        "scroll",
        () => {
          if (previewActive) clearPreview();
        },
        { passive: true }
      );
    }

    root.querySelectorAll(".hero-panel").forEach((panel) => {
      panel.addEventListener("focus", () => previewPanel(panel));
      panel.addEventListener("blur", (e) => {
        const next = e.relatedTarget;
        if (next && root.contains(next)) return;
        clearPreview();
      });
    });

    /* If nav/scroll leaves hero while a preview is sticky, drop it */
    const heroSection = document.getElementById("hero");
    if (heroSection && typeof IntersectionObserver !== "undefined") {
      const leaveObs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting && previewActive) clearPreview();
          });
        },
        { threshold: 0.2 }
      );
      leaveObs.observe(heroSection);
    }
  })();

  /* Nav + indicator update only from pickCenteredSection / goToHash (no IO fight) */

  /* ---------- Scroll effects ---------- */
  const progressBar = document.querySelector(".scroll-progress-bar");
  const header = siteHeader;
  const parallaxNodes = [...document.querySelectorAll("[data-parallax]")];
  const revealNodes = [...document.querySelectorAll("[data-reveal]")];

  /* Keep body offset in sync when the fixed header wraps (mobile) */
  function syncHeaderOffset() {
    measureHeaderHeight();
  }
  syncHeaderOffset();
  window.addEventListener("resize", syncHeaderOffset, { passive: true });
  if (typeof ResizeObserver !== "undefined" && header) {
    new ResizeObserver(syncHeaderOffset).observe(header);
  }

  function revealEl(el) {
    if (!el) return;
    el.classList.add("is-inview");
    el.removeAttribute("data-exit");
  }

  function concealEl(el) {
    if (!el || !el.classList.contains("is-inview")) return;
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const mid = rect.top + rect.height * 0.5;
    /* Leaving through the top → exit up; through the bottom → exit down */
    el.dataset.exit = mid < vh * 0.5 ? "up" : "down";
    el.classList.remove("is-inview");
    /* Clear parallax inline transform so CSS exit motion can run */
    if (el.hasAttribute("data-parallax")) el.style.transform = "";
  }

  function revealAll() {
    revealNodes.forEach(revealEl);
  }

  function isInViewport(el, pad) {
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const vw = window.innerWidth || document.documentElement.clientWidth;
    const p = pad == null ? 0 : pad;
    return r.bottom > p && r.right > 0 && r.top < vh - p && r.left < vw;
  }

  function syncReveals() {
    const band = Math.round((window.innerHeight || 0) * 0.06);
    revealNodes.forEach((el) => {
      if (isInViewport(el, band)) revealEl(el);
      else concealEl(el);
    });
  }

  function revealVisible() {
    syncReveals();
  }

  function scrollProgress() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
    if (progressBar) progressBar.style.width = pct + "%";
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 12);
  }

  function updateParallax() {
    if (reduced) return;
    const vh = window.innerHeight;
    parallaxNodes.forEach((el) => {
      if (!el.classList.contains("is-inview") && el.hasAttribute("data-reveal")) {
        el.style.transform = "";
        return;
      }
      const speed = parseFloat(el.dataset.parallax || "0.1") || 0.1;
      const rect = el.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const offset = (center - vh / 2) * speed * -0.35;
      el.style.transform = "translate3d(0," + offset.toFixed(2) + "px,0)";
    });
  }

  if (reduced) {
    revealAll();
  } else {
    document.documentElement.classList.add("reveal-on");
    syncReveals();

    const revealObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) revealEl(entry.target);
          else concealEl(entry.target);
        });
      },
      {
        /* Shrink the “live” band so exits start as content leaves the frame */
        threshold: [0, 0.08, 0.18],
        rootMargin: "-6% 0px -8% 0px",
      }
    );
    revealNodes.forEach((el) => revealObs.observe(el));

    /* First paint: show whatever is already on screen */
    setTimeout(syncReveals, 80);
  }

  let ticking = false;
  function onScrollFrame() {
    scrollProgress();
    updateParallax();
    ticking = false;
  }

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(onScrollFrame);
      }
    },
    { passive: true }
  );
  window.addEventListener(
    "resize",
    () => {
      onScrollFrame();
      if (!reduced) syncReveals();
    },
    { passive: true }
  );
  onScrollFrame();

  /* Hash landing: sync once scroll settles so the target enters cleanly */
  function revealHashTarget() {
    const id = (location.hash || "").replace(/^#/, "");
    if (!id) return;
    requestAnimationFrame(() => {
      syncReveals();
      const section = document.getElementById(id);
      if (!section) return;
      section.querySelectorAll("[data-reveal]").forEach((el) => {
        if (isInViewport(el, 0)) revealEl(el);
      });
      if (section.hasAttribute("data-reveal") && isInViewport(section, 0)) {
        revealEl(section);
      }
    });
  }
  revealHashTarget();
  window.addEventListener("hashchange", revealHashTarget);

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
    const defPos = img.dataset.defaultPos || "50% 32%";
    const defCap = caption ? caption.textContent : "";
    let applied = defSrc;
    let want = { src: defSrc, alt: defAlt, cap: defCap, pos: defPos };
    let fadeTimer = null;
    let leaveTimer = null;
    let loadToken = 0;
    let activeTrigger = null;

    function sameSrc(a, b) {
      if (!a || !b) return false;
      if (a === b) return true;
      try {
        return new URL(a, location.href).href === new URL(b, location.href).href;
      } catch (_) {
        return a === b;
      }
    }

    /* Preload swap targets to avoid flicker on first hover */
    const cache = new Map();
    triggers.forEach((t) => {
      const src = t.getAttribute("data-swap-img");
      if (!src || cache.has(src)) return;
      const pre = new Image();
      pre.decoding = "async";
      pre.src = src;
      cache.set(src, pre);
    });

    function applyFrame(next) {
      const token = ++loadToken;
      want = next;
      if (sameSrc(next.src, applied)) {
        img.style.objectPosition = next.pos;
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

      /* Short fade, then swap once the bitmap is ready */
      fadeTimer = setTimeout(() => {
        const pre = cache.get(next.src);
        if (pre && pre.complete) {
          paint();
          return;
        }
        const warm = pre || new Image();
        warm.onload = paint;
        warm.onerror = paint;
        if (!pre) {
          warm.src = next.src;
          cache.set(next.src, warm);
        } else if (warm.complete) {
          paint();
        }
      }, 120);
    }

    function showTrigger(t) {
      activeTrigger = t;
      clearTimeout(leaveTimer);
      applyFrame({
        src: t.getAttribute("data-swap-img"),
        alt: t.getAttribute("data-swap-alt") || "",
        cap: t.getAttribute("data-swap-caption") || "",
        pos: t.getAttribute("data-swap-pos") || defPos,
      });
    }

    let pinned = null;

    function clearTrigger(t) {
      if (pinned) return;
      if (activeTrigger !== t) return;
      activeTrigger = null;
      clearTimeout(leaveTimer);
      /* Debounce revert so moving between cards doesn't flash the default */
      leaveTimer = setTimeout(() => {
        if (activeTrigger || pinned) return;
        applyFrame({ src: defSrc, alt: defAlt, cap: defCap, pos: defPos });
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
      /* Tap to pin / unpin preview on touch devices */
      t.addEventListener("click", (e) => {
        if (!isTouchPreview()) return;
        e.preventDefault();
        if (pinned === t) {
          pinned = null;
          activeTrigger = null;
          applyFrame({ src: defSrc, alt: defAlt, cap: defCap, pos: defPos });
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

  function launch2HH() {
    if (!playFrame || !playWrap) return;
    if (!playFrame.getAttribute("src")) {
      playFrame.src = playFrame.getAttribute("data-src") || "https://play2hh.herokuapp.com/";
    }
    playFrame.setAttribute("scrolling", "no");
    playWrap.classList.add("is-live");
    playSectionEl?.classList.add("is-playing");
    document.body.classList.add("play-2hh-live");

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

  /* Contact — feedback mailto with “website bug” + today’s date */
  (function () {
    const feedback = document.getElementById("feedback-email");
    if (!feedback) return;

    function feedbackMailto() {
      const d = new Date();
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const subject = "website bug " + yyyy + "-" + mm + "-" + dd;
      return "mailto:playbadugi@gmail.com?subject=" + encodeURIComponent(subject);
    }

    feedback.setAttribute("href", feedbackMailto());
    feedback.addEventListener("click", () => {
      /* Refresh date at click time in case the page stayed open overnight */
      feedback.setAttribute("href", feedbackMailto());
    });
  })();
})();
