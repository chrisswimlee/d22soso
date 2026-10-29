/* Digital museum layer. Photos and logos marked [data-exhibit] become
   exhibits: the gallery lamp warms up the first time each one arrives,
   fine pointers move the light across the glass, every piece gets a wall
   tag, and clicking opens an inspect view you can walk with ← / →.
   Sections marked [data-room] get gallery signage. */
import { reduced, coarse } from "./pref.js";

const pad = (n) => String(n).padStart(2, "0");

function exhibitImg(el) {
  return el.matches("img") ? el : el.querySelector("img");
}

function exhibitInfo(el) {
  const img = exhibitImg(el);
  const cap = el.querySelector("figcaption");
  return {
    no: el.dataset.exhibitNo,
    kind: el.dataset.exhibitKind || "Exhibit",
    /* Poker swaps its photo in place, so alt + caption are read live */
    title: el.dataset.exhibitTitle || img?.alt || "",
    meta: cap?.textContent.trim() || el.dataset.exhibitMeta || "",
    note: el.dataset.exhibitNote || "",
    src: el.dataset.exhibitSrc || img?.currentSrc || img?.src || "",
    alt: img?.alt || "",
  };
}

function isShown(el) {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
}

/* ---------- Rooms: gallery signage above each section title ---------- */
function initRooms() {
  let n = 0;
  document.querySelectorAll("section[data-room]").forEach((section) => {
    const head = section.querySelector(".section-head");
    if (!head) return;
    n += 1;
    const sign = document.createElement("p");
    sign.className = "room-sign mono";
    sign.setAttribute("aria-hidden", "true");
    sign.innerHTML = `<span class="room-no">Gallery ${pad(n)}</span><span class="room-name"></span>`;
    sign.querySelector(".room-name").textContent = section.dataset.room;
    head.prepend(sign);
  });
}

/* ---------- Exhibits: fixtures, wall tag, lamp-on ---------- */
function mountExhibit(el, i) {
  const kind = el.dataset.exhibit === "object" ? "object" : "frame";
  el.dataset.exhibitNo = pad(i + 1);
  el.classList.add("exhibit", `exhibit--${kind}`);

  const fx = document.createElement("span");
  fx.className = "exhibit-fx";
  fx.setAttribute("aria-hidden", "true");
  fx.innerHTML =
    kind === "frame"
      ? '<span class="exhibit-veil"></span><span class="exhibit-beam"></span><span class="exhibit-sheen"></span><span class="exhibit-cue mono">Inspect</span>'
      : '<span class="exhibit-cone"></span><span class="exhibit-pool"></span>';
  el.append(fx);

  const tag = document.createElement("span");
  tag.className = "exhibit-tag mono";
  tag.setAttribute("aria-hidden", "true");
  tag.innerHTML = `<b>No. ${el.dataset.exhibitNo}</b><i></i>`;
  tag.querySelector("i").textContent = el.dataset.exhibitKind || "Exhibit";
  el.append(tag);

  /* Cover crops drift a few px inside the frame; contained art stays put */
  const img = exhibitImg(el);
  if (kind === "frame" && img && getComputedStyle(img).objectFit === "cover") {
    el.dataset.parallax = "";
  }

  el.tabIndex = 0;
  el.setAttribute("role", "button");
  el.setAttribute("aria-label", `Inspect exhibit ${el.dataset.exhibitNo}: ${exhibitInfo(el).title}`);
}

function initLamps(exhibits) {
  if (reduced || !("IntersectionObserver" in window)) {
    exhibits.forEach((el) => el.classList.add("is-lit"));
    return;
  }
  document.documentElement.classList.add("exhibits-on");
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-lit");
        io.unobserve(entry.target);
      });
    },
    { threshold: 0.35 }
  );
  exhibits.forEach((el) => io.observe(el));
}

/* ---------- Glass: the light follows a fine pointer across the frame ---------- */
function initGlass(exhibits) {
  if (reduced || coarse) return;
  exhibits.forEach((el) => {
    let frame = 0;
    let x = 0.5;
    let y = 0.3;
    const paint = () => {
      frame = 0;
      el.style.setProperty("--gx", x.toFixed(3));
      el.style.setProperty("--gy", y.toFixed(3));
    };
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
      el.classList.add("is-near");
      if (!frame) frame = requestAnimationFrame(paint);
    });
    el.addEventListener("pointerleave", () => {
      el.classList.remove("is-near");
      el.style.removeProperty("--gx");
      el.style.removeProperty("--gy");
    });
  });
}

/* ---------- Parallax: cover photos drift against scroll inside the crop ---------- */
function initParallax(exhibits) {
  const frames = exhibits.filter((el) => el.hasAttribute("data-parallax"));
  if (reduced || !frames.length) return;
  let ticking = false;
  const update = () => {
    ticking = false;
    const vh = window.innerHeight || 1;
    frames.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -80 || r.top > vh + 80) return;
      const t = Math.max(-1, Math.min(1, (r.top + r.height / 2 - vh / 2) / vh));
      el.style.setProperty("--drift", `${(-t * 12).toFixed(1)}px`);
    });
  };
  const request = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };
  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", request);
  update();
}

/* ---------- Inspect: lights down, the piece comes forward ---------- */
function buildInspect() {
  const dlg = document.createElement("dialog");
  dlg.className = "inspect";
  dlg.setAttribute("aria-labelledby", "inspect-title");
  dlg.innerHTML = `
    <div class="inspect-room" aria-hidden="true"></div>
    <figure class="inspect-stage">
      <img class="inspect-img" alt="" />
    </figure>
    <aside class="inspect-label">
      <p class="inspect-no mono"></p>
      <h2 class="inspect-title" id="inspect-title" tabindex="-1" autofocus></h2>
      <p class="inspect-meta mono"></p>
      <p class="inspect-note"></p>
      <div class="inspect-nav">
        <button type="button" class="inspect-step mono" data-step="-1" aria-label="Previous exhibit">←</button>
        <span class="inspect-count mono"></span>
        <button type="button" class="inspect-step mono" data-step="1" aria-label="Next exhibit">→</button>
      </div>
      <p class="inspect-hint mono">${coarse ? "Tap to look closer · swipe for the next piece" : "Click the piece to look closer · ← → to walk · Esc to leave"}</p>
    </aside>
    <button type="button" class="inspect-close mono" aria-label="Close exhibit">Close <span aria-hidden="true">×</span></button>`;
  document.body.append(dlg);
  return dlg;
}

function initInspect(exhibits) {
  if (!exhibits.length || typeof HTMLDialogElement !== "function") return;
  const dlg = buildInspect();
  const stage = dlg.querySelector(".inspect-stage");
  const view = dlg.querySelector(".inspect-img");
  const label = dlg.querySelector(".inspect-label");
  const fields = {
    no: dlg.querySelector(".inspect-no"),
    title: dlg.querySelector(".inspect-title"),
    meta: dlg.querySelector(".inspect-meta"),
    note: dlg.querySelector(".inspect-note"),
    count: dlg.querySelector(".inspect-count"),
  };
  let current = null;
  let opener = null;
  let busy = false;

  /* Measured against the unscaled layout box so the zoom never feeds back on itself */
  function aimLoupe(e) {
    const r = stage.getBoundingClientRect();
    const x = (e.clientX - r.left - view.offsetLeft) / view.offsetWidth;
    const y = (e.clientY - r.top - view.offsetTop) / view.offsetHeight;
    view.style.transformOrigin = `${Math.min(1, Math.max(0, x)) * 100}% ${Math.min(1, Math.max(0, y)) * 100}%`;
  }

  const visible = () => exhibits.filter(isShown);

  function fill(el) {
    const info = exhibitInfo(el);
    fields.no.textContent = `No. ${info.no} · ${info.kind}`;
    fields.title.textContent = info.title;
    fields.meta.textContent = info.meta;
    fields.meta.hidden = !info.meta;
    fields.note.textContent = info.note;
    fields.note.hidden = !info.note;
    fields.count.textContent = `${info.no} / ${pad(exhibits.length)}`;
    view.alt = info.alt;
    stage.classList.remove("is-zoomed");
    return new Promise((resolve) => {
      if (view.getAttribute("src") === info.src && view.complete) return resolve();
      view.onload = view.onerror = () => resolve();
      view.src = info.src;
    }).then(() => view.decode?.().catch(() => {}));
  }

  /* Transform that puts the full-size view exactly over the exhibit's crop */
  function flightFrom(el) {
    const s = (exhibitImg(el) && el.classList.contains("exhibit--object") ? exhibitImg(el) : el).getBoundingClientRect();
    const f = view.getBoundingClientRect();
    if (!s.width || !f.width) return null;
    const k = Math.max(s.width / f.width, s.height / f.height);
    const dx = s.left + s.width / 2 - (f.left + f.width / 2);
    const dy = s.top + s.height / 2 - (f.top + f.height / 2);
    const ix = Math.max(0, (f.width - s.width / k) / 2);
    const iy = Math.max(0, (f.height - s.height / k) / 2);
    return {
      transform: `translate(${dx}px, ${dy}px) scale(${k})`,
      clipPath: `inset(${iy}px ${ix}px round ${6 / k}px)`,
    };
  }

  function fly(el, direction) {
    const from = flightFrom(el);
    if (reduced || !from || !view.animate) return Promise.resolve();
    const home = { transform: "none", clipPath: "inset(0px 0px round 4px)" };
    const frames = direction === "in" ? [from, home] : [home, from];
    return view
      .animate(frames, {
        duration: direction === "in" ? 620 : 420,
        easing: direction === "in" ? "cubic-bezier(0.23, 1, 0.32, 1)" : "cubic-bezier(0.5, 0, 0.75, 0)",
        fill: "both",
      })
      .finished.catch(() => {});
  }

  async function open(el) {
    if (busy || dlg.open) return;
    busy = true;
    current = el;
    opener = document.activeElement;
    await fill(el);
    document.documentElement.classList.add("is-inspecting");
    dlg.showModal();
    el.classList.add("is-away");
    requestAnimationFrame(() => dlg.classList.add("is-open"));
    await fly(el, "in");
    view.getAnimations().forEach((a) => a.cancel());
    busy = false;
  }

  async function close() {
    if (busy || !dlg.open) return;
    busy = true;
    dlg.classList.remove("is-open");
    current?.scrollIntoView({ block: "nearest" });
    await fly(current, "out");
    current?.classList.remove("is-away");
    dlg.close();
    view.getAnimations().forEach((a) => a.cancel());
    document.documentElement.classList.remove("is-inspecting");
    /* Return to the piece you ended on, which may not be the one you opened */
    (current === opener || !current ? opener : current)?.focus({ preventScroll: true });
    busy = false;
  }

  async function step(dir) {
    if (busy) return;
    const list = visible();
    if (list.length < 2) return;
    busy = true;
    const next = list[(list.indexOf(current) + dir + list.length) % list.length];
    const out = reduced ? null : stage.animate(
      [{ opacity: 1, transform: "none" }, { opacity: 0, transform: `translateX(${-dir * 40}px)` }],
      { duration: 200, easing: "ease-in", fill: "forwards" }
    );
    label.classList.add("is-swapping");
    await out?.finished.catch(() => {});
    current.classList.remove("is-away");
    current = next;
    current.classList.add("is-away");
    await fill(next);
    out?.cancel();
    label.classList.remove("is-swapping");
    if (!reduced) {
      await stage.animate(
        [{ opacity: 0, transform: `translateX(${dir * 40}px)` }, { opacity: 1, transform: "none" }],
        { duration: 320, easing: "cubic-bezier(0.23, 1, 0.32, 1)" }
      ).finished.catch(() => {});
    }
    busy = false;
  }

  exhibits.forEach((el) => {
    el.addEventListener("click", (e) => {
      if (e.target.closest("a, button, canvas")) return;
      e.stopPropagation();
      open(el);
    });
    el.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      /* Keep Enter from also cycling the surrounding theater's atmosphere */
      e.stopPropagation();
      open(el);
    });
  });

  dlg.addEventListener("cancel", (e) => {
    e.preventDefault();
    close();
  });
  dlg.addEventListener("keydown", (e) => {
    /* Arrow keys walk the gallery; don't let page hotkeys see them */
    e.stopPropagation();
    if (e.key === "ArrowRight") step(1);
    if (e.key === "ArrowLeft") step(-1);
  });
  /* Touch: swipe the stage to walk the gallery; when zoomed, drag pans.
     A gesture that moved is never also read as a click. */
  let gesture = null;
  let swallowClick = false;
  stage.addEventListener("pointerdown", (e) => {
    gesture = { x: e.clientX, y: e.clientY, type: e.pointerType };
  });
  stage.addEventListener("pointerup", (e) => {
    if (!gesture) return;
    const dx = e.clientX - gesture.x;
    const dy = e.clientY - gesture.y;
    swallowClick = Math.hypot(dx, dy) > 10;
    const swipe = gesture.type !== "mouse" && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5;
    if (swipe && !stage.classList.contains("is-zoomed")) step(dx < 0 ? 1 : -1);
    gesture = null;
  });
  stage.addEventListener("pointercancel", () => {
    gesture = null;
  });

  dlg.addEventListener("click", (e) => {
    if (swallowClick) {
      swallowClick = false;
      return;
    }
    const stepBtn = e.target.closest("[data-step]");
    if (stepBtn) return step(Number(stepBtn.dataset.step));
    if (e.target.closest(".inspect-close")) return close();
    if (e.target === view) {
      aimLoupe(e);
      stage.classList.toggle("is-zoomed");
      return;
    }
    if (!e.target.closest(".inspect-label")) close();
  });
  /* Loupe: while zoomed, the detail follows the pointer */
  view.addEventListener("pointermove", (e) => {
    if (stage.classList.contains("is-zoomed")) aimLoupe(e);
  });
}

export function initExhibits() {
  initRooms();
  const exhibits = [...document.querySelectorAll("[data-exhibit]")];
  if (!exhibits.length) return;
  exhibits.forEach(mountExhibit);
  initLamps(exhibits);
  initGlass(exhibits);
  initParallax(exhibits);
  initInspect(exhibits);
}
