/* Orchestration: tabs, hotkeys, theme, canvas boot, bg crossfade */
(function () {
  const C = window.D22Canvas;
  const P = window.D22Physics;

  /* ---------- Dynamic background crossfade ---------- */
  const bgLayers = [...document.querySelectorAll("#bg-stage .bg-layer")];
  let activeBg = document.body.dataset.bg || "starcraft";
  let activeSectionId = "hero";

  function accentThemeForBg(bg) {
    if (bg === "about" || bg === "contact") return "starcraft";
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

  function resolveSectionBg(section) {
    if (!section) return "starcraft";
    if (section.hasAttribute("data-bg-from-tab")) {
      const tabRoot = section.querySelector("[data-tabs]");
      const selected = tabRoot?.querySelector('[role="tab"][aria-selected="true"]');
      if (selected?.dataset.theme) return selected.dataset.theme;
    }
    return section.dataset.bg || "starcraft";
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

  function applySectionScene(section) {
    if (!section) return;
    activeSectionId = section.id;
    const bg = resolveSectionBg(section);
    setSceneBg(bg, accentThemeForBg(bg));
    if (indicatorLabel) {
      indicatorLabel.textContent = SECTION_LABELS[section.id] || section.id;
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

  /* Hotkeys 1-7 nav, R roll */
  const navLinks = [...document.querySelectorAll(".command-nav a[data-hotkey]")];
  let raceApi = null;

  window.addEventListener("keydown", (e) => {
    if (e.target.matches("input, textarea, [contenteditable]")) return;
    const link = navLinks.find((a) => a.dataset.hotkey === e.key);
    if (link) {
      e.preventDefault();
      document.querySelector(link.getAttribute("href"))?.scrollIntoView({
        behavior: P && P.reduced ? "auto" : "smooth",
      });
      link.classList.add("pulse");
      setTimeout(() => link.classList.remove("pulse"), 300);
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
    let sceneCurrent = null;
    let sceneTicking = false;

    function pickCenteredSection() {
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
        sceneCurrent = best;
        applySectionScene(best);
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
        sceneCurrent = hashEl;
        applySectionScene(hashEl);
      } else {
        pickCenteredSection();
      }
    });

    window.addEventListener(
      "hashchange",
      () => {
        const id = (location.hash || "").replace(/^#/, "");
        const el = id ? document.getElementById(id) : null;
        if (el && sceneSections.includes(el)) {
          sceneCurrent = el;
          applySectionScene(el);
        }
      },
      { passive: true }
    );
  } else {
    applySectionScene(sceneSections[0]);
  }

  /* Boot canvas systems */
  if (C) {
    C.initFog(document.getElementById("fog-canvas"));
    raceApi = C.initRaceRoll(document.getElementById("race-canvas"));
    C.initBattleMap(document.getElementById("battle-canvas"));
    C.init2HH(document.getElementById("cards-2hh"));
    C.initBadugi(document.getElementById("cards-badugi"));
  }

  /* Active nav underline (game-* subsections map to the Esports link) */
  const sections = sceneSections;
  const navObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const navId = entry.target.id.startsWith("game-") ? "esports" : entry.target.id;
        navLinks.forEach((a) => {
          a.style.borderColor =
            a.getAttribute("href") === "#" + navId ? "var(--theme-accent)" : "transparent";
        });
      });
    },
    { threshold: 0.25 }
  );
  sections.forEach((s) => navObs.observe(s));

  /* ---------- Scroll effects ---------- */
  const reduced = !!(P && P.reduced);
  const progressBar = document.querySelector(".scroll-progress-bar");
  const header = document.querySelector(".site-header");
  const parallaxNodes = [...document.querySelectorAll("[data-parallax]")];
  const revealNodes = [...document.querySelectorAll("[data-reveal]")];

  function revealEl(el) {
    if (el) el.classList.add("is-inview");
  }

  function revealAll() {
    revealNodes.forEach(revealEl);
  }

  function isInViewport(el) {
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const vw = window.innerWidth || document.documentElement.clientWidth;
    return r.bottom > 0 && r.right > 0 && r.top < vh && r.left < vw;
  }

  function revealVisible() {
    revealNodes.forEach((el) => {
      if (isInViewport(el)) revealEl(el);
    });
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
      if (!el.classList.contains("is-inview") && el.hasAttribute("data-reveal")) return;
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
    revealVisible();

    const revealObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            revealEl(entry.target);
            revealObs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.01, rootMargin: "40px 0px 40px 0px" }
    );
    revealNodes.forEach((el) => {
      if (!el.classList.contains("is-inview")) revealObs.observe(el);
    });

    /* Safety nets: never leave the page blank */
    setTimeout(revealVisible, 100);
    setTimeout(revealAll, 2500);
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
      revealVisible();
    },
    { passive: true }
  );
  window.addEventListener("resize", onScrollFrame, { passive: true });
  onScrollFrame();

  /* Hash targets (e.g. #play) should reveal immediately */
  function revealHashTarget() {
    const id = (location.hash || "").replace(/^#/, "");
    if (!id) return;
    const section = document.getElementById(id);
    if (!section) return;
    section.querySelectorAll("[data-reveal]").forEach(revealEl);
    if (section.hasAttribute("data-reveal")) revealEl(section);
  }
  revealHashTarget();
  window.addEventListener("hashchange", revealHashTarget);

  /* Poker gallery — hover/focus a block to swap the featured photo */
  (function () {
    const gallery = document.querySelector("[data-poker-gallery]");
    const img = document.getElementById("poker-photo-img");
    if (!gallery || !img) return;
    const caption = gallery.querySelector(".poker-photo-caption");
    const triggers = [...gallery.querySelectorAll("[data-swap-img]")];
    const defSrc = img.dataset.default || img.getAttribute("src");
    const defAlt = img.dataset.defaultAlt || img.getAttribute("alt");
    const defCap = caption ? caption.textContent : "";
    let applied = img.getAttribute("src"); // what's currently shown
    let want = { src: defSrc, alt: defAlt, cap: defCap };
    let fadeTimer = null;
    let leaveTimer = null;

    /* Preload swap targets to avoid flicker on first hover */
    triggers.forEach((t) => {
      const src = t.getAttribute("data-swap-img");
      if (src) {
        const pre = new Image();
        pre.src = src;
      }
    });

    /* Single-timer "latest wins" crossfade — immune to rapid hover races */
    function doSwap(src, alt, cap) {
      want = { src, alt, cap };
      if (src === applied) {
        clearTimeout(fadeTimer);
        fadeTimer = null;
        img.classList.remove("is-swapping");
        return;
      }
      img.classList.add("is-swapping");
      clearTimeout(fadeTimer);
      fadeTimer = setTimeout(() => {
        applied = want.src;
        img.src = want.src;
        if (want.alt) img.alt = want.alt;
        if (caption && want.cap) caption.textContent = want.cap;
        requestAnimationFrame(() => img.classList.remove("is-swapping"));
      }, 180);
    }

    triggers.forEach((t) => {
      const src = t.getAttribute("data-swap-img");
      const alt = t.getAttribute("data-swap-alt") || "";
      const cap = t.getAttribute("data-swap-caption") || "";
      /* Enter cancels any pending revert (absorbs hover-lift flicker) */
      const on = () => {
        clearTimeout(leaveTimer);
        doSwap(src, alt, cap);
      };
      /* Leave is debounced so a transient re-enter won't reset the image */
      const off = () => {
        clearTimeout(leaveTimer);
        leaveTimer = setTimeout(() => doSwap(defSrc, defAlt, defCap), 110);
      };
      t.addEventListener("mouseenter", on);
      t.addEventListener("mouseleave", off);
      t.addEventListener("focusin", on);
      t.addEventListener("focusout", off);
    });
  })();

  /* In-page 2HH game embed */
  const playWrap = document.getElementById("play-2hh-wrap");
  const playFrame = document.getElementById("play-2hh-frame");
  const playStart = document.getElementById("play-2hh-start");
  const playFs = document.getElementById("play-2hh-fs");

  function launch2HH() {
    if (!playFrame || !playWrap) return;
    if (!playFrame.getAttribute("src")) {
      playFrame.src = playFrame.getAttribute("data-src") || "https://play2hh.herokuapp.com/";
    }
    playWrap.classList.add("is-live");
  }

  playStart?.addEventListener("click", launch2HH);
  playFs?.addEventListener("click", () => {
    launch2HH();
    const target = playWrap;
    if (!target) return;
    const req =
      target.requestFullscreen ||
      target.webkitRequestFullscreen ||
      target.msRequestFullscreen;
    if (req) req.call(target);
  });

  /* Prefetch iframe when Play section nears viewport */
  const playSection = document.getElementById("play");
  if (playSection && playFrame && "IntersectionObserver" in window) {
    const playObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            /* warm DNS only; wait for Launch click to preserve bandwidth */
            playObs.disconnect();
          }
        });
      },
      { rootMargin: "200px 0px" }
    );
    playObs.observe(playSection);
  }
})();
