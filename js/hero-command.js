/* Hero command field: click the open photograph and a small squad moves there. */
import { reduced } from "./pref.js";

const UNIT_COUNT = 5;
const SLOTS = [
  [-22, -6],
  [0, -16],
  [22, -6],
  [-12, 12],
  [12, 12],
];

export function initHeroCommand() {
  const field = document.querySelector(".hero-mid");
  const hero = document.getElementById("hero");
  if (!field || !hero) return;

  const canvas = document.createElement("canvas");
  canvas.className = "hero-command";
  canvas.setAttribute("aria-hidden", "true");
  field.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const units = SLOTS.map(([sx, sy], i) => ({
    x: 0,
    y: 0,
    tx: 0,
    ty: 0,
    sx,
    sy,
    face: 0,
    seed: i * 1.7,
  }));
  let placed = false;
  let ping = null;
  let pointer = null;
  let raf = 0;
  let running = false;

  function starcraftOn() {
    const fleet = document.body.dataset.heroFleet || "";
    return fleet === "" || fleet === "starcraft";
  }

  function onHero() {
    return (document.body.dataset.bg || "hero") === "hero" && starcraftOn();
  }

  function introBusy() {
    const root = document.documentElement;
    return root.classList.contains("is-intro-pending") || root.hasAttribute("data-intro");
  }

  function resize() {
    const rect = field.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!placed) {
      const cx = w * 0.5;
      const cy = h * 0.62;
      units.forEach((u) => {
        u.x = u.tx = cx + u.sx;
        u.y = u.ty = cy + u.sy;
      });
      placed = true;
    }
    paint();
  }

  function order(px, py) {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const x = Math.max(16, Math.min(w - 16, px));
    const y = Math.max(16, Math.min(h - 16, py));
    units.forEach((u) => {
      u.tx = x + u.sx;
      u.ty = y + u.sy;
      u.face = Math.atan2(u.ty - u.y, u.tx - u.x);
    });
    ping = { x, y, life: 1 };
    kick();
  }

  function step(dt) {
    let moving = false;
    const speed = reduced ? 10000 : 220;
    units.forEach((u) => {
      const dx = u.tx - u.x;
      const dy = u.ty - u.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 0.6) {
        u.x = u.tx;
        u.y = u.ty;
        return;
      }
      moving = true;
      const stepDist = Math.min(dist, speed * dt);
      u.x += (dx / dist) * stepDist;
      u.y += (dy / dist) * stepDist;
      u.face = Math.atan2(dy, dx);
    });
    if (ping) {
      ping.life -= dt / (reduced ? 0.01 : 0.55);
      if (ping.life <= 0) ping = null;
    }
    return moving || !!ping || !!pointer;
  }

  function paint() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);
    if (!onHero() || introBusy() || w < 8 || h < 8) return;

    if (ping) {
      const r = (1 - ping.life) * 28 + 6;
      ctx.beginPath();
      ctx.arc(ping.x, ping.y, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(232, 196, 74, ${ping.life * 0.85})`;
      ctx.lineWidth = 1.25;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(ping.x - 7, ping.y);
      ctx.lineTo(ping.x + 7, ping.y);
      ctx.moveTo(ping.x, ping.y - 7);
      ctx.lineTo(ping.x, ping.y + 7);
      ctx.stroke();
    }

    units.forEach((u) => drawUnit(u));

    if (pointer && !reduced) {
      ctx.beginPath();
      ctx.arc(pointer.x, pointer.y, 7, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(232, 196, 74, 0.7)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  function drawUnit(u) {
    ctx.save();
    ctx.translate(u.x, u.y);
    ctx.rotate(u.face);
    ctx.fillStyle = "rgba(10, 10, 10, 0.72)";
    ctx.strokeStyle = "#e8c44a";
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.roundRect(-5, -7, 10, 14, 1.5);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(5, 0);
    ctx.lineTo(9, 0);
    ctx.stroke();
    ctx.restore();
  }

  function kick() {
    if (reduced) {
      step(1);
      paint();
      return;
    }
    if (running) return;
    running = true;
    let last = performance.now();
    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const keep = step(dt);
      paint();
      if (keep && onHero() && !introBusy()) raf = requestAnimationFrame(frame);
      else running = false;
    };
    raf = requestAnimationFrame(frame);
  }

  function local(e) {
    const r = field.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  field.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || !onHero() || introBusy()) return;
    const p = local(e);
    order(p.x, p.y);
  });

  field.addEventListener("pointermove", (e) => {
    if (!onHero() || introBusy() || reduced) return;
    pointer = local(e);
    kick();
  });

  field.addEventListener("pointerleave", () => {
    pointer = null;
    paint();
  });

  const ro = new ResizeObserver(resize);
  ro.observe(field);
  resize();

  const watch = new MutationObserver(() => {
    paint();
  });
  watch.observe(document.body, { attributes: true, attributeFilter: ["data-bg", "data-hero-fleet"] });
  watch.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class", "data-intro"],
  });
}
