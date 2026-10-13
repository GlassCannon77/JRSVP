// Ambient seasonal animation drawn on a canvas behind the invitation.
// startMotif returns a stop() function. Honors prefers-reduced-motion by
// painting one still frame, and pauses while the canvas is off screen.

const TAU = Math.PI * 2;
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[(Math.random() * arr.length) | 0];

const KINDS = {
  bats: { count: 7, spawn: (w, h, c) => ({ x: rand(-60, w), y: rand(20, h * 0.7), s: rand(0.6, 1.3), vx: rand(0.35, 0.9), ph: rand(0, TAU), col: pick(c), wob: rand(10, 30) }),
    step(p, w, h, t) { p.x += p.vx; p.ph += 0.16; if (p.x > w + 60) { p.x = -60; p.y = rand(20, h * 0.7); } },
    draw(g, p, t) {
      const flap = Math.sin(p.ph) * 0.8, y = p.y + Math.sin(p.ph * 0.15) * p.wob;
      g.save(); g.translate(p.x, y); g.scale(p.s, p.s); g.fillStyle = p.col;
      g.beginPath(); g.ellipse(0, 0, 4, 6, 0, 0, TAU); g.fill();
      for (const dir of [-1, 1]) {
        g.beginPath(); g.moveTo(0, -2);
        g.quadraticCurveTo(dir * 10, -12 * flap - 4, dir * 22, -8 * flap);
        g.quadraticCurveTo(dir * 17, -2, dir * 14, 2 - 2 * flap);
        g.quadraticCurveTo(dir * 10, -1, dir * 7, 4);
        g.quadraticCurveTo(dir * 4, 1, 0, 3); g.fill();
      }
      g.restore();
    } },
  leaves: { count: 16, spawn: (w, h, c, init) => ({ x: rand(0, w), y: init ? rand(-h, h) : rand(-60, -20), s: rand(0.6, 1.2), vy: rand(0.5, 1.1), sw: rand(0.6, 1.6), ph: rand(0, TAU), r: rand(0, TAU), vr: rand(-0.03, 0.03), col: pick(c) }),
    step(p, w, h) { p.y += p.vy; p.ph += 0.02; p.x += Math.sin(p.ph) * p.sw; p.r += p.vr; return p.y < h + 40; },
    draw(g, p) {
      g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.scale(p.s, p.s); g.fillStyle = p.col;
      g.beginPath(); g.moveTo(0, -12); g.quadraticCurveTo(10, -6, 0, 12); g.quadraticCurveTo(-10, -6, 0, -12); g.fill();
      g.strokeStyle = "rgba(0,0,0,.25)"; g.lineWidth = 1; g.beginPath(); g.moveTo(0, -10); g.lineTo(0, 14); g.stroke();
      g.restore();
    } },
  snow: { count: 70, spawn: (w, h, c, init) => ({ x: rand(0, w), y: init ? rand(-h, h) : -6, r: rand(1, 3.2), vy: rand(0.3, 1), ph: rand(0, TAU), col: pick(c), a: rand(0.5, 0.95) }),
    step(p, w, h) { p.y += p.vy; p.ph += 0.01; p.x += Math.sin(p.ph) * 0.4; return p.y < h + 6; },
    draw(g, p) { g.globalAlpha = p.a; g.fillStyle = p.col; g.beginPath(); g.arc(p.x, p.y, p.r, 0, TAU); g.fill(); g.globalAlpha = 1; } },
  sparkles: { count: 26, spawn: (w, h, c) => ({ x: rand(0, w), y: rand(0, h), s: rand(3, 8), ph: rand(0, TAU), sp: rand(0.015, 0.04), col: pick(c) }),
    step(p, w, h) { p.ph += p.sp; if (p.ph > TAU * 2) { p.ph = 0; p.x = rand(0, w); p.y = rand(0, h); } },
    draw(g, p) {
      const a = Math.max(0, Math.sin(p.ph)); if (a < 0.02) return;
      g.globalAlpha = a * 0.9; g.fillStyle = p.col; const s = p.s * (0.6 + a * 0.4);
      g.beginPath(); g.moveTo(p.x, p.y - s); g.quadraticCurveTo(p.x, p.y, p.x + s, p.y); g.quadraticCurveTo(p.x, p.y, p.x, p.y + s);
      g.quadraticCurveTo(p.x, p.y, p.x - s, p.y); g.quadraticCurveTo(p.x, p.y, p.x, p.y - s); g.fill(); g.globalAlpha = 1;
    } },
  confetti: { count: 46, spawn: (w, h, c, init) => ({ x: rand(0, w), y: init ? rand(-h, h) : -10, w: rand(4, 8), h: rand(8, 13), vy: rand(0.8, 1.8), vx: rand(-0.4, 0.4), r: rand(0, TAU), vr: rand(-0.08, 0.08), ph: rand(0, TAU), col: pick(c) }),
    step(p, w, h) { p.y += p.vy; p.x += p.vx; p.r += p.vr; p.ph += 0.08; return p.y < h + 14; },
    draw(g, p) { g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.scale(1, Math.cos(p.ph)); g.fillStyle = p.col; g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); g.restore(); } },
  bubbles: { count: 22, spawn: (w, h, c, init) => ({ x: rand(0, w), y: init ? rand(0, h * 2) : h + 12, r: rand(3, 10), vy: rand(0.3, 0.8), ph: rand(0, TAU), col: pick(c) }),
    step(p, w, h) { p.y -= p.vy; p.ph += 0.03; p.x += Math.sin(p.ph) * 0.3; return p.y > -14; },
    draw(g, p) { g.strokeStyle = p.col; g.globalAlpha = 0.55; g.lineWidth = 1.6; g.beginPath(); g.arc(p.x, p.y, p.r, 0, TAU); g.stroke();
      g.globalAlpha = 0.35; g.fillStyle = p.col; g.beginPath(); g.arc(p.x - p.r * 0.35, p.y - p.r * 0.35, p.r * 0.25, 0, TAU); g.fill(); g.globalAlpha = 1; } },
  hearts: { count: 16, spawn: (w, h, c, init) => ({ x: rand(0, w), y: init ? rand(0, h * 2) : h + 16, s: rand(0.5, 1.2), vy: rand(0.35, 0.8), ph: rand(0, TAU), col: pick(c), a: rand(0.4, 0.85) }),
    step(p, w, h) { p.y -= p.vy; p.ph += 0.025; p.x += Math.sin(p.ph) * 0.5; return p.y > -20; },
    draw(g, p) { g.save(); g.translate(p.x, p.y); g.scale(p.s, p.s); g.rotate(Math.sin(p.ph) * 0.2); g.globalAlpha = p.a; g.fillStyle = p.col;
      g.beginPath(); g.moveTo(0, 6); g.bezierCurveTo(-12, -2, -6, -12, 0, -5); g.bezierCurveTo(6, -12, 12, -2, 0, 6); g.fill(); g.restore(); } },
  clovers: { count: 14, spawn: (w, h, c, init) => ({ x: rand(0, w), y: init ? rand(-h, h) : -20, s: rand(0.5, 1.1), vy: rand(0.4, 0.9), r: rand(0, TAU), vr: rand(-0.02, 0.02), ph: rand(0, TAU), col: pick(c) }),
    step(p, w, h) { p.y += p.vy; p.r += p.vr; p.ph += 0.02; p.x += Math.sin(p.ph) * 0.5; return p.y < h + 20; },
    draw(g, p) { g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.scale(p.s, p.s); g.fillStyle = p.col;
      for (let i = 0; i < 3; i++) { g.rotate(TAU / 3); g.beginPath(); g.arc(0, -6, 5.5, 0, TAU); g.fill(); }
      g.strokeStyle = p.col; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(2, 8, 6, 13); g.stroke(); g.restore(); } },
  petals: { count: 22, spawn: (w, h, c, init) => ({ x: rand(0, w), y: init ? rand(-h, h) : -12, s: rand(0.6, 1.2), vy: rand(0.4, 0.9), r: rand(0, TAU), vr: rand(-0.03, 0.03), ph: rand(0, TAU), col: pick(c) }),
    step(p, w, h) { p.y += p.vy; p.r += p.vr; p.ph += 0.03; p.x += Math.sin(p.ph) * 0.7; return p.y < h + 14; },
    draw(g, p) { g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.scale(p.s, p.s * Math.abs(Math.cos(p.ph)) + 0.3); g.fillStyle = p.col; g.globalAlpha = 0.85;
      g.beginPath(); g.ellipse(0, 0, 5, 9, 0, 0, TAU); g.fill(); g.restore(); } },
  balloons: { count: 7, spawn: (w, h, c, init) => ({ x: rand(20, w - 20), y: init ? rand(h * 0.2, h * 1.6) : h + 60, s: rand(0.7, 1.15), vy: rand(0.35, 0.7), ph: rand(0, TAU), col: pick(c) }),
    step(p, w, h) { p.y -= p.vy; p.ph += 0.02; return p.y > -90; },
    draw(g, p) { const x = p.x + Math.sin(p.ph) * 8; g.save(); g.translate(x, p.y); g.scale(p.s, p.s); g.globalAlpha = 0.9;
      g.strokeStyle = p.col; g.lineWidth = 1.2; g.beginPath(); g.moveTo(0, 22); g.quadraticCurveTo(-6 * Math.sin(p.ph), 40, 0, 58); g.stroke();
      g.fillStyle = p.col; g.beginPath(); g.ellipse(0, 0, 15, 19, 0, 0, TAU); g.fill();
      g.beginPath(); g.moveTo(-3, 22); g.lineTo(3, 22); g.lineTo(0, 18); g.fill();
      g.fillStyle = "rgba(255,255,255,.45)"; g.beginPath(); g.ellipse(-6, -7, 3, 6, -0.5, 0, TAU); g.fill(); g.restore(); } },
  fireworks: { count: 0 },
};

export function startMotif(canvas, motif, colors, amount = 2) {
  const kind = KINDS[motif];
  const g = canvas.getContext("2d");
  const ctx = { stopped: false, raf: 0, visible: true };
  let W = 0, H = 0, parts = [], sparks = [], nextBurst = 0;
  const clear = () => { const r = canvas.getBoundingClientRect(); g.clearRect(0, 0, r.width, r.height); };
  if (!kind || amount <= 0) { resize(); clear(); return () => {}; }
  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mult = [0, 0.45, 1, 1.7][amount] || 1;

  function resize() {
    const r = canvas.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  const scale = Math.min(2.2, Math.max(0.6, (W * H) / (420 * 900)));
  const n = Math.round(kind.count * mult * scale);
  for (let i = 0; i < n; i++) parts.push(kind.spawn(W, H, colors, true));

  function burst(t) {
    const x = rand(W * 0.15, W * 0.85), y = rand(H * 0.08, H * 0.45), col = pick(colors), k = 26 + ((Math.random() * 14) | 0);
    for (let i = 0; i < k; i++) { const a = (i / k) * TAU, v = rand(1.2, 2.6); sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, col }); }
    nextBurst = t + rand(900, 2200) / mult;
  }

  function frame(t) {
    if (ctx.stopped) return;
    g.clearRect(0, 0, W, H);
    if (motif === "fireworks") {
      if (t > nextBurst && !reduce) burst(t);
      sparks = sparks.filter((s) => s.life > 0);
      for (const s of sparks) {
        s.x += s.vx; s.y += s.vy; s.vy += 0.025; s.vx *= 0.985; s.life -= 0.012;
        g.globalAlpha = Math.max(0, s.life); g.fillStyle = s.col; g.beginPath(); g.arc(s.x, s.y, 1.8, 0, TAU); g.fill();
      }
      g.globalAlpha = 1;
    } else {
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        if (!reduce && kind.step(p, W, H, t) === false) parts[i] = kind.spawn(W, H, colors, false);
        kind.draw(g, parts[i], t);
      }
    }
    if (!reduce && ctx.visible && !document.hidden) ctx.raf = requestAnimationFrame(frame);
  }

  if (reduce && motif === "fireworks") { for (let i = 0; i < 3; i++) { burst(0); } for (let j = 0; j < 30; j++) sparks.forEach((s) => { s.x += s.vx; s.y += s.vy; s.vy += 0.025; }); }
  ctx.raf = requestAnimationFrame(frame);

  const io = "IntersectionObserver" in window ? new IntersectionObserver((es) => {
    const v = es.some((e) => e.isIntersecting);
    if (v && !ctx.visible && !reduce) { ctx.visible = true; ctx.raf = requestAnimationFrame(frame); }
    ctx.visible = v;
  }) : null;
  io && io.observe(canvas);
  const onVis = () => { if (!document.hidden && ctx.visible && !reduce) { cancelAnimationFrame(ctx.raf); ctx.raf = requestAnimationFrame(frame); } };
  document.addEventListener("visibilitychange", onVis);
  const ro = "ResizeObserver" in window ? new ResizeObserver(() => { resize(); if (reduce) frame(0); }) : null;
  ro && ro.observe(canvas);

  return () => { ctx.stopped = true; cancelAnimationFrame(ctx.raf); io && io.disconnect(); ro && ro.disconnect(); document.removeEventListener("visibilitychange", onVis); clear(); };
}
