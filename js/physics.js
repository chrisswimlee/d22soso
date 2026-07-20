/* Tiny spring / impulse helpers for game-feel */
(function (global) {
  const reduced =
    typeof matchMedia !== "undefined" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches;

  function Spring(opts) {
    this.x = opts.x || 0;
    this.v = 0;
    this.target = opts.target != null ? opts.target : this.x;
    this.stiffness = opts.stiffness || 180;
    this.damping = opts.damping || 18;
    this.mass = opts.mass || 1;
  }

  Spring.prototype.setTarget = function (t) {
    this.target = t;
  };

  Spring.prototype.step = function (dt) {
    if (reduced) {
      this.x = this.target;
      this.v = 0;
      return this.x;
    }
    const force = -this.stiffness * (this.x - this.target);
    const accel = (force - this.damping * this.v) / this.mass;
    this.v += accel * dt;
    this.x += this.v * dt;
    return this.x;
  };

  function Particle(x, y, vx, vy, life, color) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.life = life;
    this.max = life;
    this.color = color;
  }

  Particle.prototype.step = function (dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += 40 * dt;
    this.life -= dt;
  };

  function resizeCanvas(canvas, cssW, cssH) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = cssW || canvas.clientWidth || canvas.width;
    const h = cssH || canvas.clientHeight || canvas.height;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w, h, dpr, reduced };
  }

  global.D22Physics = { Spring, Particle, resizeCanvas, reduced };
})(window);
