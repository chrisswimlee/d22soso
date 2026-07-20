/* Canvas systems: fog, minimap, race roll, battle map, card physics */
(function (global) {
  const P = global.D22Physics;
  if (!P) return;

  /* ---------- FOG OF WAR ---------- */
  function initFog(canvas) {
    const coarse =
      typeof matchMedia !== "undefined" &&
      matchMedia("(pointer: coarse)").matches;
    const shortLandscape =
      typeof matchMedia !== "undefined" &&
      matchMedia("(max-height: 480px) and (orientation: landscape)").matches;
    if (!canvas || P.reduced || shortLandscape) {
      if (canvas) canvas.style.display = "none";
      return;
    }
    let w = 0, h = 0, ctx;
    const holes = [];
    const key = "d22-fog-holes";
    try {
      const saved = JSON.parse(sessionStorage.getItem(key) || "[]");
      saved.forEach((h0) => holes.push(h0));
    } catch (_) {}

    function viewportSize() {
      const vv = window.visualViewport;
      return {
        w: Math.round((vv && vv.width) || window.innerWidth),
        h: Math.round((vv && vv.height) || window.innerHeight),
      };
    }

    function resize() {
      const s = viewportSize();
      w = s.w;
      h = s.h;
      const r = P.resizeCanvas(canvas, w, h);
      ctx = r.ctx;
    }

    function scout(x, y, r) {
      if (!w || !h) return;
      holes.push({ x: x / w, y: y / h, r: (r || 90) / Math.min(w, h) });
      if (holes.length > (coarse ? 40 : 80)) holes.shift();
      try {
        sessionStorage.setItem(key, JSON.stringify(holes.slice(-40)));
      } catch (_) {}
    }

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = coarse ? "rgba(6, 6, 10, 0.45)" : "rgba(6, 6, 10, 0.72)";
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "destination-out";
      holes.forEach((hole) => {
        const hx = hole.x * w;
        const hy = hole.y * h;
        const hr = hole.r * Math.min(w, h);
        const g = ctx.createRadialGradient(hx, hy, 0, hx, hy, hr);
        g.addColorStop(0, "rgba(0,0,0,0.95)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(hx, hy, hr, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalCompositeOperation = "source-over";
    }

    let lastScout = 0;
    function onPointer(e) {
      const now = performance.now();
      const throttle = coarse ? 48 : 16;
      if (now - lastScout < throttle) return;
      lastScout = now;
      if (!coarse && Math.random() > 0.55) return;
      const radius = coarse ? 100 + Math.random() * 40 : 70 + Math.random() * 40;
      scout(e.clientX, e.clientY, radius);
      draw();
    }

    resize();
    draw();
    window.addEventListener("resize", () => {
      resize();
      draw();
    });
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", () => {
        resize();
        draw();
      });
    }
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("pointerdown", onPointer, { passive: true });

    return { scout, draw };
  }

  /* ---------- MINIMAP ---------- */
  function initMinimap(canvas, nodes) {
    if (!canvas) return;
    const rects = nodes.map((id) => document.getElementById(id)).filter(Boolean);
    let active = 0;
    let layout = [];

    function cssSize() {
      const r = canvas.getBoundingClientRect();
      return {
        w: Math.max(88, Math.round(r.width) || 160),
        h: Math.max(66, Math.round(r.height) || 120),
      };
    }

    function paint() {
      const size = cssSize();
      const { ctx, w, h } = P.resizeCanvas(canvas, size.w, size.h);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#0a0a0e";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(139,92,246,0.25)";
      ctx.strokeRect(4, 4, w - 8, h - 8);

      const cols = w < 120 ? 5 : 3;
      const cellW = (w - 16) / cols;
      const cellH = (h - 20) / Math.ceil(rects.length / cols);
      layout = [];
      rects.forEach((el, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = 10 + col * cellW + cellW * 0.3;
        const y = 14 + row * cellH + cellH * 0.35;
        layout.push({ x, y, r: w < 120 ? 5 : 7 });
        const on = i === active;
        ctx.fillStyle = on ? "#8b5cf6" : "#2a2a32";
        ctx.beginPath();
        ctx.arc(x, y, on ? layout[i].r : layout[i].r - 1.5, 0, Math.PI * 2);
        ctx.fill();
        if (on) {
          ctx.strokeStyle = "rgba(212,175,55,0.8)";
          ctx.beginPath();
          ctx.arc(x, y, layout[i].r + 4, 0, Math.PI * 2);
          ctx.stroke();
        }
        if (w >= 120) {
          ctx.fillStyle = "#9a9690";
          ctx.font = "8px JetBrains Mono, monospace";
          ctx.fillText(el.id.slice(0, 4), x + 8, y + 3);
        }
      });
      const scrollMax = document.documentElement.scrollHeight - window.innerHeight || 1;
      const scroll = window.scrollY / scrollMax;
      ctx.strokeStyle = "#d4af37";
      ctx.strokeRect(8, 6 + scroll * (h - 28), w - 16, 16);
    }

    function sync() {
      const mid = window.scrollY + window.innerHeight * 0.35;
      let best = 0;
      let bestDist = Infinity;
      rects.forEach((el, i) => {
        const top = el.getBoundingClientRect().top + window.scrollY;
        const d = Math.abs(top - mid);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      active = best;
      paint();
    }

    function jumpAt(clientX, clientY) {
      const r = canvas.getBoundingClientRect();
      const x = ((clientX - r.left) / r.width) * cssSize().w;
      const y = ((clientY - r.top) / r.height) * cssSize().h;
      let hit = -1;
      layout.forEach((node, i) => {
        if (Math.hypot(x - node.x, y - node.y) < Math.max(14, node.r + 10)) hit = i;
      });
      if (hit >= 0) {
        rects[hit].scrollIntoView({ behavior: P.reduced ? "auto" : "smooth" });
      }
    }

    canvas.addEventListener("click", (e) => jumpAt(e.clientX, e.clientY));

    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", () => {
      paint();
      sync();
    });
    paint();
    sync();
  }

  /* ---------- RANDOM RACE ROLL ---------- */
  function initRaceRoll(canvas) {
    if (!canvas) return { roll: () => {} };
    const races = [
      { name: "TERRAN", color: "#9ca3af", accent: "#ef4444" },
      { name: "ZERG", color: "#a78bfa", accent: "#22c55e" },
      { name: "PROTOSS", color: "#fbbf24", accent: "#2dd4bf" },
    ];
    let spinning = false;
    let angle = 0;
    let vel = 0;
    let settled = false;
    let particles = [];
    let raf;

    function size() {
      return P.resizeCanvas(canvas, canvas.clientWidth || 420, 280);
    }

    function burst(cx, cy) {
      for (let i = 0; i < 36; i++) {
        const a = (Math.PI * 2 * i) / 36;
        const sp = 80 + Math.random() * 160;
        particles.push(
          new P.Particle(
            cx,
            cy,
            Math.cos(a) * sp,
            Math.sin(a) * sp,
            0.6 + Math.random() * 0.5,
            i % 2 ? "#8b5cf6" : "#d4af37"
          )
        );
      }
    }

    function drawFrame(dt) {
      const { ctx, w, h } = size();
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#08080c";
      ctx.fillRect(0, 0, w, h);

      if (spinning || vel > 0.01) {
        angle += vel * dt;
        vel *= 0.985;
        if (vel < 0.35 && spinning) {
          spinning = false;
          settled = true;
          vel = 0;
          // land on Random — show all three
          burst(w / 2, h / 2);
          document.body.dataset.race = "random";
        }
      }

      const idx = Math.floor(((angle % (Math.PI * 2)) / (Math.PI * 2)) * 3 + 3) % 3;
      const showAll = settled && !spinning;

      races.forEach((race, i) => {
        const active = showAll || i === idx;
        const x = w * (0.2 + i * 0.3);
        const y = h * 0.45;
        const scale = active ? 1 : 0.75;
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        ctx.fillStyle = active ? race.color : "#1a1a20";
        ctx.strokeStyle = active ? race.accent : "#333";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-48, -36, 96, 72, 6);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#0a0a0a";
        ctx.font = "bold 12px JetBrains Mono, monospace";
        ctx.textAlign = "center";
        ctx.fillText(race.name, 0, 4);
        ctx.restore();
      });

      ctx.fillStyle = "#d4af37";
      ctx.font = "11px JetBrains Mono, monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        settled ? "RANDOM — ALL RACES, ONE MIND" : "CLICK OR PRESS R TO ROLL",
        w / 2,
        h - 18
      );

      particles = particles.filter((p) => p.life > 0);
      particles.forEach((p) => {
        p.step(dt);
        ctx.globalAlpha = Math.max(0, p.life / p.max);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 2, 2);
        ctx.globalAlpha = 1;
      });

      raf = requestAnimationFrame(() => drawFrame(1 / 60));
    }

    function roll() {
      if (P.reduced) {
        settled = true;
        document.body.dataset.race = "random";
        drawFrame(0);
        return;
      }
      spinning = true;
      settled = false;
      vel = 18 + Math.random() * 10;
    }

    canvas.addEventListener("click", roll);
    drawFrame(0);

    return { roll };
  }

  /* ---------- LOST TEMPLE BATTLE MAP ---------- */
  function initBattleMap(canvas) {
    if (!canvas) return;
    let t0 = performance.now();
    let visible = true;
    const obs = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
    });
    obs.observe(canvas);

    function loop() {
      if (!visible) {
        requestAnimationFrame(loop);
        return;
      }
      const { ctx, w, h } = P.resizeCanvas(canvas, canvas.clientWidth || 480, 280);
      const t = (performance.now() - t0) / 1000;
      ctx.clearRect(0, 0, w, h);
      // map base
      ctx.fillStyle = "#101418";
      ctx.fillRect(0, 0, w, h);
      // fog
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(0, 0, w, h * 0.35);
      // temple ramps (abstract)
      ctx.strokeStyle = "rgba(139,92,246,0.4)";
      ctx.strokeRect(w * 0.12, h * 0.18, w * 0.22, h * 0.22);
      ctx.strokeRect(w * 0.66, h * 0.18, w * 0.22, h * 0.22);
      ctx.strokeRect(w * 0.12, h * 0.58, w * 0.22, h * 0.22);
      ctx.strokeRect(w * 0.66, h * 0.58, w * 0.22, h * 0.22);
      ctx.fillStyle = "rgba(45,212,191,0.15)";
      ctx.fillRect(w * 0.38, h * 0.38, w * 0.24, h * 0.24);

      // three prongs
      const progress = P.reduced ? 1 : Math.min(1, (t % 6) / 4);
      const paths = [
        { x0: w * 0.75, y0: h * 0.7, x1: w * 0.55, y1: h * 0.45, c: "#fbbf24" },
        { x0: w * 0.25, y0: h * 0.7, x1: w * 0.4, y1: h * 0.45, c: "#2dd4bf" },
        { x0: w * 0.5, y0: h * 0.85, x1: w * 0.5, y1: h * 0.5, c: "#8b5cf6" },
      ];
      paths.forEach((p) => {
        const x = p.x0 + (p.x1 - p.x0) * progress;
        const y = p.y0 + (p.y1 - p.y0) * progress;
        ctx.strokeStyle = p.c;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p.x0, p.y0);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.fillStyle = p.c;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.fillStyle = "#d4af37";
      ctx.font = "10px JetBrains Mono, monospace";
      ctx.fillText("LOST TEMPLE // SEMI-FINAL // ~38:00 // vs GRRRR…", 12, h - 12);

      requestAnimationFrame(loop);
    }
    loop();
  }

  /* ---------- 2 HAND HOLD'EM ---------- */
  function init2HH(canvas) {
    if (!canvas) return;
    const suits = ["♠", "♥", "♦", "♣"];
    const ranks = ["A", "K", "Q", "J", "T", "9"];
    function card() {
      return {
        rank: ranks[(Math.random() * ranks.length) | 0],
        suit: suits[(Math.random() * suits.length) | 0],
        x: new P.Spring({ x: 0 }),
        y: new P.Spring({ x: 0 }),
      };
    }
    let hole = [card(), card(), card(), card()];
    let board = [card(), card(), card()];
    let split = false;
    let dragging = false;

    function layout() {
      const cssW = canvas.clientWidth || 480;
      const cssH = Math.max(220, Math.round(cssW * 0.62));
      const { w, h } = P.resizeCanvas(canvas, cssW, cssH);
      const gap = Math.min(70, w * 0.15);
      const baseY = h * 0.62;
      hole.forEach((c, i) => {
        if (!split) {
          const start = (w - gap * 3) / 2;
          c.x.setTarget(start + i * gap);
          c.y.setTarget(baseY);
        } else {
          const hand = i < 2 ? 0 : 1;
          const handGap = Math.min(55, w * 0.12);
          c.x.setTarget(w * (hand === 0 ? 0.22 : 0.62) + (i % 2) * handGap);
          c.y.setTarget(baseY);
        }
      });
      board.forEach((c, i) => {
        const start = (w - gap * 2) / 2;
        c.x.setTarget(start + i * gap);
        c.y.setTarget(h * 0.28);
      });
      return { w, h };
    }

    hole.forEach((c, i) => {
      c.x.x = 40 + i * 20;
      c.y.x = 40;
    });

    function drawCard(ctx, c) {
      const x = c.x.x;
      const y = c.y.x;
      ctx.fillStyle = "#f8f5ef";
      ctx.strokeStyle = "#222";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(x - 28, y - 40, 56, 80, 5);
      ctx.fill();
      ctx.stroke();
      const red = c.suit === "♥" || c.suit === "♦";
      ctx.fillStyle = red ? "#b91c1c" : "#111";
      ctx.font = "bold 16px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(c.rank + c.suit, x, y + 6);
    }

    let visible = true;
    const obs = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
    });
    obs.observe(canvas);

    function tick() {
      if (visible) {
        const { ctx, w, h } = layout();
        const dt = 1 / 60;
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = "#0a1a12";
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "rgba(212,175,55,0.7)";
        ctx.font = "10px JetBrains Mono, monospace";
        ctx.fillText(split ? "TWO HANDS // ONE BOARD" : "DEALT — CLICK TO SPLIT", 12, 18);
        hole.forEach((c) => {
          c.x.step(dt);
          c.y.step(dt);
          drawCard(ctx, c);
        });
        board.forEach((c) => {
          c.x.step(dt);
          c.y.step(dt);
          drawCard(ctx, c);
        });
        if (split) {
          ctx.strokeStyle = "rgba(56,189,248,0.5)";
          ctx.strokeRect(w * 0.12, h * 0.48, w * 0.28, h * 0.4);
          ctx.strokeStyle = "rgba(251,113,133,0.5)";
          ctx.strokeRect(w * 0.52, h * 0.48, w * 0.28, h * 0.4);
        }
      }
      requestAnimationFrame(tick);
    }

    canvas.addEventListener("click", () => {
      split = !split;
      if (!split) {
        hole = [card(), card(), card(), card()];
        board = [card(), card(), card()];
      }
    });
    tick();
  }

  /* ---------- BADUGI TRIAD ---------- */
  function initBadugi(canvas) {
    if (!canvas) return;
    const suits = ["♠", "♥", "♦", "♣"];
    const ranks = ["A", "2", "3", "4", "5"];
    function make(i) {
      return {
        rank: ranks[i % ranks.length],
        suit: suits[i % 4],
        x: new P.Spring({ x: 0 }),
        y: new P.Spring({ x: 0 }),
        alpha: 1,
        chosen: false,
        rejected: false,
      };
    }
    let community = [make(0), make(1), make(2)];
    let picked = false;

    function layout(w, h) {
      community.forEach((c, i) => {
        if (c.chosen) {
          c.x.setTarget(w * 0.5);
          c.y.setTarget(h * 0.72);
        } else if (c.rejected) {
          c.x.setTarget(w * (0.2 + i * 0.3));
          c.y.setTarget(h * 1.2);
        } else {
          c.x.setTarget(w * (0.25 + i * 0.25));
          c.y.setTarget(h * 0.4);
        }
      });
    }

    community.forEach((c, i) => {
      c.x.x = 100 + i * 40;
      c.y.x = 20;
    });

    let visible = true;
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
    }).observe(canvas);

    function tick() {
      if (visible) {
        const { ctx, w, h } = P.resizeCanvas(canvas, canvas.clientWidth || 480, 300);
        const dt = 1 / 60;
        layout(w, h);
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = "#0a1018";
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "#94a3b8";
        ctx.font = "10px JetBrains Mono, monospace";
        ctx.fillText(picked ? "HAND COMPLETE — CLICK TO RESET" : "PICK 1 OF 3 COMMUNITY CARDS", 12, 18);

        community.forEach((c) => {
          c.x.step(dt);
          c.y.step(dt);
          if (c.rejected) c.alpha = Math.max(0, c.alpha - dt * 1.2);
          ctx.globalAlpha = c.alpha;
          ctx.fillStyle = "#e8eef5";
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(c.x.x - 28, c.y.x - 40, 56, 80, 5);
          else ctx.rect(c.x.x - 28, c.y.x - 40, 56, 80);
          ctx.fill();
          ctx.strokeStyle = c.chosen ? "#e0f2fe" : "#334155";
          ctx.lineWidth = c.chosen ? 2.5 : 1;
          ctx.stroke();
          ctx.fillStyle = "#0f172a";
          ctx.font = "bold 15px Inter, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(c.rank + c.suit, c.x.x, c.y.x + 6);
          ctx.globalAlpha = 1;
        });
      }
      requestAnimationFrame(tick);
    }

    canvas.addEventListener("click", (e) => {
      if (picked) {
        community = [make(0), make(1), make(2)];
        community.forEach((c, i) => {
          c.x.x = 100 + i * 40;
          c.y.x = 20;
        });
        picked = false;
        return;
      }
      const r = canvas.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * (canvas.clientWidth || 480);
      let best = 0;
      let bestD = Infinity;
      community.forEach((c, i) => {
        const d = Math.abs(c.x.x - x);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      community.forEach((c, i) => {
        if (i === best) c.chosen = true;
        else c.rejected = true;
      });
      picked = true;
    });
    tick();
  }

  global.D22Canvas = {
    initFog,
    initMinimap,
    initRaceRoll,
    initBattleMap,
    init2HH,
    initBadugi,
  };
})(window);
