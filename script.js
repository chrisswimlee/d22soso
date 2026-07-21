/* Orchestration: tabs, hotkeys, theme, WebGL boot, bg crossfade */
import { ScrollTrigger } from "gsap/ScrollTrigger";
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
        if (indicatorLabel) {
          indicatorLabel.textContent = SECTION_LABELS[section.id] || section.id;
        }
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
    hero: "Briefing",
    about: "About",
    esports: "StarCraft",
    "game-cnc": "Command & Conquer",
    "game-warcraft": "Warcraft",
    "game-mtg": "Magic: The Gathering",
    "game-hearthstone": "Hearthstone",
    poker: "Poker",
    book: "Betting on Yourself",
    innovation: "Casino Innovation",
    play: "Play 2 Hand Hold'em",
    contact: "Comms",
  };
  const indicatorLabel = document.querySelector("#section-indicator .si-label");

  setupGamePanelThemes();

  function applySectionScene(section) {
    if (!section) return;
    activeSectionId = section.id;
    const bg = resolveSectionBg(section);
    setSceneBg(bg, accentThemeForBg(bg));
    if (indicatorLabel) {
      indicatorLabel.textContent = SECTION_LABELS[section.id] || section.id;
    }
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

  /* Hotkeys 1-8 nav, R roll — clicks use the same scroll path */
  const navLinks = [...document.querySelectorAll(".command-nav a[data-hotkey]")];
  const brandLink = document.querySelector(".brand[href]");
  const commandNav = document.querySelector(".command-nav");
  const siteHeader = document.querySelector(".site-header");
  let raceApi = null;

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

  function markActiveNav(sectionId) {
    const navId = sectionId.startsWith("game-") ? "esports" : sectionId;
    navLinks.forEach((a) => {
      a.style.borderColor =
        a.getAttribute("href") === "#" + navId ? "var(--theme-accent)" : "transparent";
    });
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

    /* scrollIntoView + CSS scroll-margin-top — more reliable than manual scrollTo */
    try {
      target.scrollIntoView({
        behavior: reduced ? "auto" : "smooth",
        block: "start",
        inline: "nearest",
      });
    } catch (_) {
      const top =
        window.scrollY +
        target.getBoundingClientRect().top -
        measureHeaderHeight() -
        12;
      window.scrollTo(0, Math.max(0, top));
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

  /* Start the menu at hotkey 1 — flex overflow can leave Briefing scrolled out of view */
  if (commandNav) {
    commandNav.scrollLeft = 0;
    requestAnimationFrame(() => {
      commandNav.scrollLeft = 0;
    });
  }

  /* In-page CTA anchors (Play, About, Esports, etc.) */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    if (a.classList.contains("command-nav") || a.closest(".command-nav") || a === brandLink) return;
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

  /* Center-of-viewport section → background theme */
  const sceneSections = [
    "hero",
    "about",
    "esports",
    "game-cnc",
    "game-warcraft",
    "game-mtg",
    "game-hearthstone",
    "poker",
    "book",
    "innovation",
    "play",
    "contact",
  ]
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  if (sceneSections.length) {
    /* Continuous nearest-center detection — reliable for tall sections
     * (IntersectionObserver thresholds fire too sparsely on big targets). */
    let sceneTicking = false;

    function pickCenteredSection() {
      if (navProgrammatic || performance.now() < navScrollLockUntil) return;
      const vh = window.innerHeight || 1;
      const mid = vh * 0.5;
      let best = null;
      let bestDist = Infinity;
      for (const el of sceneSections) {
        const rect = el.getBoundingClientRect();
        /* Skip sections entirely off-screen */
        if (rect.bottom < 0 || rect.top > vh) continue;
        const center = rect.top + rect.height * 0.5;
        const dist = Math.abs(center - mid);
        if (dist < bestDist) {
          bestDist = dist;
          best = el;
        }
      }
      if (best && best !== sceneCurrent) {
        claimSceneSection(best);
        applySectionScene(best);
        markActiveNav(best.id);
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
  requestAnimationFrame(() => ScrollTrigger.refresh());

  /* Active nav underline — deferred to pickCenteredSection during programmatic jumps */
  const sections = sceneSections;
  const navObs = new IntersectionObserver(
    (entries) => {
      if (navProgrammatic || performance.now() < navScrollLockUntil) return;
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        markActiveNav(entry.target.id);
      });
    },
    { threshold: 0.35 }
  );
  sections.forEach((s) => navObs.observe(s));

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

  /* In-page 2HH game embed */
  const playWrap = document.getElementById("play-2hh-wrap");
  const playFrame = document.getElementById("play-2hh-frame");
  const playStart = document.getElementById("play-2hh-start");
  const playFs = document.getElementById("play-2hh-fs");
  const playCenter = document.getElementById("play-2hh-center");
  const playExitImmersive = document.getElementById("play-2hh-exit-immersive");
  const playSectionEl = document.getElementById("play");
  const playCtas = playSectionEl?.querySelector(".play-ctas");

  function canFullscreen(el) {
    return !!(
      el &&
      (el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen) &&
      document.fullscreenEnabled !== false
    );
  }

  function syncPlayChrome() {
    if (!playWrap || !playSectionEl) return;
    if (playWrap.classList.contains("is-immersive")) {
      playWrap.style.setProperty("--play-chrome", "0px");
      playWrap.style.removeProperty("height");
      playWrap.style.removeProperty("max-height");
      return;
    }

    const headerH = measureHeaderHeight();
    const safeBottom =
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--safe-bottom")) || 0;
    const vv = window.visualViewport;
    const viewH = vv?.height || window.innerHeight;
    const viewTop = vv?.offsetTop || 0;

    const ctasVisible = playCtas && getComputedStyle(playCtas).display !== "none";
    const rawCtasH = ctasVisible ? playCtas.getBoundingClientRect().height : 0;
    /* Cap stacked CTA height so the table never collapses on phones */
    const mobile = typeof matchMedia !== "undefined" && matchMedia("(max-width: 768px)").matches;
    const ctasH = Math.min(rawCtasH, mobile ? 52 : 96);

    const wrapStyles = getComputedStyle(playWrap);
    const wrapMarginBottom = parseFloat(wrapStyles.marginBottom) || 0;
    const wrapBorder =
      (parseFloat(wrapStyles.borderTopWidth) || 0) + (parseFloat(wrapStyles.borderBottomWidth) || 0);

    const below = ctasH + wrapMarginBottom + safeBottom + 8;
    const fallbackChrome = Math.ceil(headerH + below + 16);
    playWrap.style.setProperty("--play-chrome", fallbackChrome + "px");

    if (!playWrap.classList.contains("is-live") || viewH <= 0) {
      playWrap.style.removeProperty("height");
      playWrap.style.removeProperty("max-height");
      return;
    }

    const rect = playWrap.getBoundingClientRect();
    /* Don't reslice height while the frame is mostly off-screen */
    if (rect.bottom < 100 || rect.top > viewH - 48) return;

    const topInView = rect.top - viewTop;
    const useTop =
      topInView > 0 && topInView < viewH ? topInView : Math.min(headerH + 8, viewH * 0.2);
    const fitted = Math.max(280, Math.floor(viewH - useTop - below - wrapBorder));
    playWrap.style.height = fitted + "px";
    playWrap.style.maxHeight = fitted + "px";
  }

  function centerPlayTable() {
    if (!playWrap) return;
    playWrap.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      block: "start",
      inline: "nearest",
    });
    window.setTimeout(syncPlayChrome, reduced ? 40 : 320);
  }

  function setImmersive(on) {
    if (!playWrap) return;
    playWrap.classList.toggle("is-immersive", on);
    document.body.classList.toggle("play-2hh-immersive", on);
    if (playExitImmersive) {
      playExitImmersive.hidden = !on;
      if (on) {
        try {
          playExitImmersive.focus({ preventScroll: true });
        } catch (_) {
          playExitImmersive.focus();
        }
      }
    }
    if (on) {
      playWrap.style.removeProperty("height");
      playWrap.style.removeProperty("max-height");
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
    syncPlayChrome();
    requestAnimationFrame(() => {
      playSectionEl?.scrollIntoView({
        behavior: reduced ? "auto" : "smooth",
        block: "start",
        inline: "nearest",
      });
      /* Remeasure after layout + scroll settle so the table isn't short */
      requestAnimationFrame(syncPlayChrome);
      window.setTimeout(syncPlayChrome, reduced ? 40 : 320);
    });
  }

  playStart?.addEventListener("click", launch2HH);
  playCenter?.addEventListener("click", centerPlayTable);
  playExitImmersive?.addEventListener("click", () => setImmersive(false));

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
      Promise.resolve(req.call(target)).catch(() => setImmersive(true));
      return;
    }
    /* iOS Safari / unsupported: CSS immersive fallback */
    setImmersive(true);
  });

  window.addEventListener("resize", syncPlayChrome, { passive: true });
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", syncPlayChrome, { passive: true });
  }
  function onFullscreenChange() {
    const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
    if (!fsEl) setImmersive(false);
  }
  document.addEventListener("fullscreenchange", onFullscreenChange);
  document.addEventListener("webkitfullscreenchange", onFullscreenChange);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && playWrap?.classList.contains("is-immersive")) {
      setImmersive(false);
    }
  });
  syncPlayChrome();

  /* Hero portrait — click / keyboard to cycle D22 archive gallery */
  (function () {
    const root = document.getElementById("hero-gallery");
    const img = document.getElementById("hero-gallery-img");
    const cap = document.getElementById("hero-gallery-cap");
    const badge = document.getElementById("hero-gallery-badge");
    const count = document.getElementById("hero-gallery-count");
    if (!root || !img) return;

    const gallery = [
      {
        src: "assets/photos/AAA%20Wayne%20Chiang%20Starcraft%20World%20Champ.JPG",
        alt: "Wayne D22-soso Chiang with StarCraft Brood War world championship trophy",
        caption: "World Champion · Brood War S1 · 1999",
        badge: "★ WORLD CHAMPION",
        pos: "48% 36%",
      },
      {
        src: "assets/photos/AAA%20Wayne%20Chiang%20Starcraft%20World%20Champ%20and%20PGL%202nd.JPG",
        alt: "Wayne D22-soso Chiang with StarCraft World Champion and PGL trophies",
        caption: "Champion archive · Brood War + PGL era",
        badge: "★ TROPHY ROOM",
        pos: "50% 40%",
      },
      {
        src: "assets/photos/AAA%20Starcraft%20World%20Champ%20Close%20Up.JPG",
        alt: "Close-up of Wayne D22-soso Chiang as StarCraft World Champion",
        caption: "Close-up · World Champion portrait",
        badge: "★ CLOSE-UP",
        pos: "50% 28%",
      },
      {
        src: "assets/photos/Slayers%20Boxer%20D22-soso%20WSOP%202025.jpg",
        alt: "D22-soso with SlayerS BoxeR at WSOP 2025",
        caption: "WSOP 2025 · with SlayerS_BoxeR",
        badge: "★ WSOP 2025",
        pos: "50% 32%",
      },
      {
        src: "assets/photos/D22-soso%20Elky.JPG",
        alt: "D22-soso with poker pro ElkY",
        caption: "Live at the Bike · with ElkY",
        badge: "★ FELT ERA",
        pos: "50% 28%",
      },
      {
        src: "assets/photos/Garimto%20D22-soso%202024.jpg",
        alt: "Garimto and D22-soso in 2024",
        caption: "2024 · with Garimto",
        badge: "★ 2024",
        pos: "50% 30%",
      },
      {
        src: "assets/photos/Tastosis%20D22-soso%202024.jpg",
        alt: "Tastosis and D22-soso in 2024",
        caption: "2024 · with Tastosis",
        badge: "★ CAST CREW",
        pos: "50% 30%",
      },
    ];

    let index = 0;
    let busy = false;
    const cache = new Map();

    function preload(i) {
      const slide = gallery[i % gallery.length];
      if (!slide || cache.has(slide.src)) return;
      const pre = new Image();
      pre.decoding = "async";
      pre.src = slide.src;
      cache.set(slide.src, pre);
    }

    function paint(i) {
      const slide = gallery[i];
      if (!slide) return;
      index = i;
      img.style.objectPosition = slide.pos || "50% 35%";
      img.src = slide.src;
      img.alt = slide.alt;
      if (cap) cap.textContent = slide.caption;
      if (badge) badge.textContent = slide.badge;
      if (count) count.textContent = i + 1 + " / " + gallery.length;
      const nextHint =
        typeof matchMedia !== "undefined" &&
        (matchMedia("(pointer: coarse)").matches || matchMedia("(hover: none)").matches)
          ? "Tap for next."
          : "Click for next.";
      root.setAttribute(
        "aria-label",
        "Archive photo " + (i + 1) + " of " + gallery.length + ": " + slide.caption + ". " + nextHint
      );
      root.title = nextHint.replace(/\.$/, "") + " archive photo";
      /* Warm only the next slide (avoid loading all 7 on first paint) */
      preload((i + 1) % gallery.length);
    }

    const flipReduced =
      typeof matchMedia !== "undefined" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches;
    const FLIP_OUT_MS = flipReduced ? 0 : 280;
    const FLIP_IN_MS = flipReduced ? 0 : 400;

    function goTo(nextIndex) {
      if (busy || gallery.length < 2) return;
      const target = ((nextIndex % gallery.length) + gallery.length) % gallery.length;
      if (target === index) return;
      busy = true;
      const slide = gallery[target];
      let settled = false;

      const finishIn = () => {
        img.classList.remove("is-flip-in");
        root.classList.remove("is-flipping");
        busy = false;
      };

      const showTarget = () => {
        if (settled) return;
        settled = true;
        paint(target);
        img.classList.remove("is-flip-out");
        if (flipReduced) {
          finishIn();
          return;
        }
        void img.offsetWidth;
        img.classList.add("is-flip-in");
        setTimeout(finishIn, FLIP_IN_MS);
      };

      /* Start the out-flip immediately so rapid clicks feel responsive */
      root.classList.add("is-flipping");
      img.classList.remove("is-flip-in");
      img.classList.add("is-flip-out");

      const afterOut = () => {
        const pre = cache.get(slide.src);
        if (pre && pre.complete) {
          showTarget();
          return;
        }
        const warm = pre || new Image();
        const failSafe = window.setTimeout(showTarget, 1200);
        const ready = () => {
          window.clearTimeout(failSafe);
          showTarget();
        };
        warm.onload = ready;
        warm.onerror = ready;
        if (!pre) {
          warm.src = slide.src;
          cache.set(slide.src, warm);
        } else if (warm.complete) {
          ready();
        }
      };

      setTimeout(afterOut, FLIP_OUT_MS);
    }

    function next() {
      goTo(index + 1);
    }

    function prev() {
      goTo(index - 1);
    }

    paint(0);
    preload(1 % gallery.length);

    root.addEventListener("click", (e) => {
      e.preventDefault();
      next();
    });
    root.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      }
    });
  })();

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
