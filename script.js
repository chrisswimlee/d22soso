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

  /* Hotkeys 1-5 nav, R roll */
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
      "contact",
    ]);
    raceApi = C.initRaceRoll(document.getElementById("race-canvas"));
    C.initBattleMap(document.getElementById("battle-canvas"));
    C.init2HH(document.getElementById("cards-2hh"));
    C.initBadugi(document.getElementById("cards-badugi"));
  }

  /* Active nav underline */
  const sections = ["hero", "esports", "poker", "innovation", "contact"]
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
})();
