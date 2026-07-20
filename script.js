/* Orchestration: tabs, hotkeys, theme, canvas boot */
(function () {
  const C = window.D22Canvas;
  const P = window.D22Physics;

  /* Tabs */
  function setupTabs(root) {
    const tablist = root.querySelector('[role="tablist"]');
    if (!tablist) return;
    const tabs = [...tablist.querySelectorAll('[role="tab"]')];
    const panels = tabs.map((t) => document.getElementById(t.getAttribute("aria-controls"))).filter(Boolean);

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
      if (theme) document.body.dataset.theme = theme;
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

  /* Hotkeys 1-6 nav, R roll */
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

  /* Section theme when scrolling poker/contact */
  const themeSections = [
    { id: "poker", theme: "poker" },
    { id: "play", theme: "2hh" },
    { id: "contact", theme: "starcraft" },
  ];
  const themeObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const match = themeSections.find((s) => s.id === entry.target.id);
        if (match) document.body.dataset.theme = match.theme;
      });
    },
    { threshold: 0.35 }
  );
  themeSections.forEach((s) => {
    const el = document.getElementById(s.id);
    if (el) themeObs.observe(el);
  });

  /* Boot canvas systems */
  if (C) {
    C.initFog(document.getElementById("fog-canvas"));
    C.initMinimap(document.getElementById("minimap-canvas"), [
      "hero",
      "esports",
      "poker",
      "innovation",
      "play",
      "contact",
    ]);
    raceApi = C.initRaceRoll(document.getElementById("race-canvas"));
    C.initBattleMap(document.getElementById("battle-canvas"));
    C.init2HH(document.getElementById("cards-2hh"));
    C.initBadugi(document.getElementById("cards-badugi"));
  }

  /* Active nav underline */
  const sections = ["hero", "esports", "poker", "innovation", "play", "contact"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  const navObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((a) => {
          a.style.borderColor =
            a.getAttribute("href") === "#" + entry.target.id ? "var(--theme-accent)" : "transparent";
        });
      });
    },
    { threshold: 0.25 }
  );
  sections.forEach((s) => navObs.observe(s));

  /* ---------- Scroll effects ---------- */
  const reduced = P && P.reduced;
  const progressBar = document.querySelector(".scroll-progress-bar");
  const header = document.querySelector(".site-header");
  const parallaxNodes = [...document.querySelectorAll("[data-parallax]")];

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
      const speed = parseFloat(el.dataset.parallax || "0.1") || 0.1;
      const rect = el.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const offset = (center - vh / 2) * speed * -0.35;
      el.style.transform = "translate3d(0," + offset.toFixed(2) + "px,0)";
    });
  }

  if (!reduced) {
    const revealObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-inview");
            revealObs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => revealObs.observe(el));
  } else {
    document.querySelectorAll("[data-reveal]").forEach((el) => el.classList.add("is-inview"));
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
  window.addEventListener("resize", onScrollFrame, { passive: true });
  onScrollFrame();

  /* Hero enters immediately */
  const heroReveal = document.querySelector("#hero [data-reveal]");
  if (heroReveal) {
    requestAnimationFrame(() => heroReveal.classList.add("is-inview"));
  }
})();
