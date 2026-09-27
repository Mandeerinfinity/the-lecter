/* Atmosphere: charcoal brush, Florence sketch, fog on glass, death's-head moths, night-vision grain. */
'use strict';
/* ——— paper tooth noise (shared) ——— */
const Tooth = (() => {
  const N = 256, a = new Float32Array(N * N), r = mulberry32(1991);
  for (let i = 0; i < N * N; i++) a[i] = r();
  const b = new Float32Array(N * N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { let s = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) s += a[((y + dy) & 255) * N + ((x + dx) & 255)]; b[y * N + x] = s / 9 * 0.6 + a[y * N + x] * 0.4; }
  let mn = 1, mx = 0; b.forEach(v => { mn = Math.min(mn, v); mx = Math.max(mx, v); });
  for (let i = 0; i < b.length; i++) b[i] = (b[i] - mn) / (mx - mn);
  return { at: (x, y) => b[((y | 0) & 255) * N + ((x | 0) & 255)] };
})();

class CharcoalBrush {
  constructor(ctx, dpr = 1) { this.ctx = ctx; this.dpr = dpr; this.tool = 'charcoal'; this.size = 7; this.color = '#171413'; this.last = null; }
  stamp(x, y, p, dir) {
    const c = this.ctx, s = this.size * (0.55 + p * 0.7);
    if (this.tool === 'smudge') {
      if (!this.last) return; const dx = x - this.last.x, dy = y - this.last.y; if (dx * dx + dy * dy < 1) return;
      c.save(); c.beginPath(); c.arc(x, y, s * 1.4, 0, TAU); c.clip(); c.globalAlpha = 0.35;
      const d = this.dpr; c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(c.canvas, -dx * d * 0.9, -dy * d * 0.9); c.restore(); return;
    }
    const n = Math.ceil(s * s * (this.tool === 'eraser' ? 0.8 : 1.1));
    c.save();
    if (this.tool === 'eraser') c.globalCompositeOperation = 'destination-out';
    c.fillStyle = this.tool === 'chalk' ? '#f4efe3' : this.color;
    const thresh = 0.28 + p * 0.6;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, rr = Math.abs((Math.random() + Math.random() + Math.random() - 1.5) / 1.5) * s;
      const px = x + Math.cos(a) * rr * (1 + 0.4 * Math.abs(Math.cos(a - dir))), py = y + Math.sin(a) * rr;
      if (this.tool !== 'eraser' && Tooth.at(px * this.dpr, py * this.dpr) > thresh) continue;
      c.globalAlpha = (this.tool === 'eraser' ? 0.5 : 0.22 + Math.random() * 0.35) * (1 - rr / s * 0.6);
      const sz = 0.7 + Math.random() * 1.1; c.fillRect(px, py, sz, sz);
    }
    if (this.tool === 'charcoal' && Math.random() < 0.4) { c.globalAlpha = 0.035 * p; c.beginPath(); c.arc(x, y, s * 0.9, 0, TAU); c.fill(); }
    c.restore();
  }
  down(x, y, p = 0.5) { this.last = { x, y }; this.stamp(x, y, p, 0); }
  move(x, y, p = 0.5) {
    if (!this.last) return this.down(x, y, p);
    const dx = x - this.last.x, dy = y - this.last.y, dist = Math.hypot(dx, dy), dir = Math.atan2(dy, dx), step = Math.max(1, this.size * 0.35);
    const n = Math.ceil(dist / step);
    for (let i = 1; i <= n; i++) { const t = i / n; const px = this.last.x + dx * t, py = this.last.y + dy * t; this.stamp(px, py, p, dir); if (this.tool === 'smudge') this.last = { x: px, y: py }; }
    this.last = { x, y };
  }
  up() { this.last = null; }
}

/* Hand-drawn Florence (Duomo, campanile, rooftops) */
function drawFlorence(ctx, x0, y0, S, style = {}) {
  const r = mulberry32(style.seed || 3), col = style.color || 'rgba(20,18,16,.5)', passes = style.passes || 2;
  const line = (ax, ay, bx, by) => { for (let p = 0; p < passes; p++) { ctx.beginPath(); const j = S * 0.004; ctx.moveTo(x0 + ax * S + (r() - .5) * j, y0 + ay * S + (r() - .5) * j);
    const mx = (ax + bx) / 2 + (r() - .5) * 0.004, my = (ay + by) / 2 + (r() - .5) * 0.004; ctx.quadraticCurveTo(x0 + mx * S, y0 + my * S, x0 + bx * S + (r() - .5) * j, y0 + by * S + (r() - .5) * j); ctx.stroke(); } };
  const poly = (pts) => { for (let i = 0; i < pts.length - 1; i++) line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]); };
  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = style.lw || Math.max(0.6, S * 0.0022); ctx.lineCap = 'round';
  // dome (pointed, ribbed)
  const cx = 0.42, base = 0.52, dw = 0.2, top = 0.2;
  for (let k = 0; k <= 1; k++) { ctx.beginPath(); for (let i = 0; i <= 40; i++) { const t = i / 40, sx = cx + (k ? 1 : -1) * dw * Math.sqrt(1 - t) * (1 - 0.15 * t), sy = base - (base - top) * Math.pow(t, 0.9); i ? ctx.lineTo(x0 + sx * S, y0 + sy * S) : ctx.moveTo(x0 + sx * S, y0 + sy * S); } ctx.stroke(); }
  [-0.55, 0, 0.55].forEach(f => { ctx.beginPath(); for (let i = 0; i <= 30; i++) { const t = i / 30, sx = cx + f * dw * Math.sqrt(1 - t) * (1 - 0.15 * t), sy = base - (base - top) * Math.pow(t, 0.9); i ? ctx.lineTo(x0 + sx * S, y0 + sy * S) : ctx.moveTo(x0 + sx * S, y0 + sy * S); } ctx.stroke(); });
  poly([[cx - 0.02, top], [cx - 0.02, top - 0.04], [cx - 0.008, top - 0.07], [cx + 0.008, top - 0.07], [cx + 0.02, top - 0.04], [cx + 0.02, top]]); line(cx, top - 0.07, cx, top - 0.1);
  poly([[cx - dw - 0.02, base], [cx + dw + 0.02, base], [cx + dw + 0.02, base + 0.06], [cx - dw - 0.02, base + 0.06], [cx - dw - 0.02, base]]);
  for (let i = 0; i < 7; i++) { const wx = cx - dw + 0.03 + i * 0.058; ctx.beginPath(); ctx.arc(x0 + wx * S, y0 + (base + 0.03) * S, S * 0.012, 0, TAU); ctx.stroke(); }
  // nave
  poly([[0.05, 0.66], [0.05, 0.6], [0.22, 0.6], [0.22, 0.58], [cx - dw - 0.02, 0.58]]); poly([[0.02, 0.66], [0.12, 0.56], [0.22, 0.6]]);
  // campanile
  const bx = 0.74; poly([[bx, 0.7], [bx, 0.12], [bx + 0.07, 0.12], [bx + 0.07, 0.7]]); poly([[bx - 0.008, 0.12], [bx + 0.078, 0.12]]);
  for (let k = 0; k < 5; k++) { const yy = 0.18 + k * 0.1; poly([[bx, yy], [bx + 0.07, yy]]); ctx.beginPath(); ctx.moveTo(x0 + (bx + 0.022) * S, y0 + (yy + 0.07) * S); ctx.lineTo(x0 + (bx + 0.022) * S, y0 + (yy + 0.03) * S); ctx.arc(x0 + (bx + 0.035) * S, y0 + (yy + 0.03) * S, S * 0.013, Math.PI, 0); ctx.lineTo(x0 + (bx + 0.048) * S, y0 + (yy + 0.07) * S); ctx.stroke(); }
  // rooftops
  let xx = -0.02; while (xx < 1.02) { const w = 0.05 + r() * 0.08, h = 0.05 + r() * 0.07, yb = 0.82; poly([[xx, yb], [xx, yb - h], [xx + w / 2, yb - h - 0.025], [xx + w, yb - h], [xx + w, yb]]);
    for (let q = 0; q < 2; q++) { const wx = xx + w * (0.25 + q * 0.35); ctx.strokeRect(x0 + wx * S, y0 + (yb - h + 0.02) * S, S * 0.012, S * 0.018); } xx += w + 0.005; }
  // hatching for shade
  ctx.globalAlpha = 0.6; for (let k = 0; k < 26; k++) { const t = k / 26; line(cx + dw * 0.35 + t * dw * 0.55, base - 0.02, cx + dw * 0.2 + t * dw * 0.5, base - 0.18 + t * 0.12); }
  ctx.restore();
}

/* ——— page background ——— */
const Backdrop = {
  cv: null,
  init() { this.cv = $('#bg'); this.draw(); },
  draw() {
    const cv = this.cv, d = Math.min(devicePixelRatio || 1, 2), W = innerWidth, H = innerHeight; cv.width = W * d; cv.height = H * d;
    const x = cv.getContext('2d'); x.scale(d, d); const T = Watch.theme;
    const g = x.createRadialGradient(W * 0.36, H * 0.48, 0, W * 0.4, H * 0.5, Math.max(W, H) * 0.8);
    g.addColorStop(0, mix(T.bg, T.dial[0], 0.35)); g.addColorStop(0.5, T.bg); g.addColorStop(1, '#000000'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    const S = Math.min(W, H) * 1.05;
    drawFlorence(x, W - S * 0.95, H - S * 0.9, S, { color: T.nv ? 'rgba(150,255,140,.05)' : 'rgba(230,220,200,.045)', passes: 2, seed: 11, lw: 1 });
    const r = mulberry32(5); for (let i = 0; i < W * H / 60; i++) { x.fillStyle = `rgba(255,255,255,${r() * 0.018})`; x.fillRect(r() * W, r() * H, 1, 1); }
  }
};

/* ——— fog / breath on the crystal (float density field, patchy cloud noise) ——— */
const Fog = {
  cv: null, ctx: null, N: 128, d: null, cloud: null, small: null, sctx: null, img: null, grain: null, amount: 0, anim: null,
  init(canvas) {
    this.cv = canvas; this.ctx = canvas.getContext('2d'); const N = this.N;
    this.d = new Float32Array(N * N); this.cloud = new Float32Array(N * N);
    // multi-octave value noise for patchy condensation
    const r = mulberry32(77), oct = [[8, 0.5], [16, 0.3], [32, 0.2]];
    oct.forEach(([g, w]) => { const grid = Array.from({ length: (g + 1) * (g + 1) }, () => r());
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const gx = x / N * g, gy = y / N * g, x0 = gx | 0, y0 = gy | 0, fx = gx - x0, fy = gy - y0, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
        const v = lerp(lerp(grid[y0 * (g + 1) + x0], grid[y0 * (g + 1) + x0 + 1], sx), lerp(grid[(y0 + 1) * (g + 1) + x0], grid[(y0 + 1) * (g + 1) + x0 + 1], sx), sy); this.cloud[y * N + x] += v * w; } });
    this.small = document.createElement('canvas'); this.small.width = this.small.height = N; this.sctx = this.small.getContext('2d'); this.img = this.sctx.createImageData(N, N);
    const g = document.createElement('canvas'); g.width = g.height = 96; const gx = g.getContext('2d');
    for (let i = 0; i < 700; i++) { const x = Math.random() * 96, y = Math.random() * 96, rr = Math.random() * 1.3 + 0.3; gx.beginPath(); gx.arc(x, y, rr, 0, TAU); gx.fillStyle = `rgba(255,255,255,${0.15 + Math.random() * 0.35})`; gx.fill(); }
    this.grain = g; this.resize();
  },
  resize() { const css = this.cv.clientWidth || 600, d = Math.min(devicePixelRatio || 1, 2); this.cv.width = css * d; this.cv.height = css * d; this.css = css; this.dp = d; this.pat = null; },
  breathe() {
    if (!Settings.fog) { toast('Breath on the glass is switched off in Settings'); return; }
    const N = this.N, start = performance.now(), r = mulberry32(Date.now() & 0xffff), cx = N * (0.45 + r() * 0.1), cy = N * (0.55 + r() * 0.1);
    cancelAnimationFrame(this.anim);
    const step = () => { const t = Math.min(1, (performance.now() - start) / 700), rad = N * (0.18 + 0.42 * Math.sqrt(t));
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const i = y * N + x, dd = Math.hypot(x - cx, (y - cy) * 1.1) / rad; if (dd > 1.3) continue;
        const target = clamp((1.15 - dd) * (0.55 + this.cloud[i] * 0.9), 0, 1); if (target > this.d[i]) this.d[i] += (target - this.d[i]) * 0.35; }
      this.amount = 1; if (t < 1) this.anim = requestAnimationFrame(step); };
    step(); Bus.emit('fog');
  },
  wipe(x, y, rad = 0.07) {
    if (this.amount < 0.01) return; const N = this.N, px = x / this.css * N, py = y / this.css * N, rr = rad * N;
    for (let yy = Math.max(0, py - rr | 0); yy < Math.min(N, py + rr + 1); yy++) for (let xx = Math.max(0, px - rr | 0); xx < Math.min(N, px + rr + 1); xx++) {
      const dd = Math.hypot(xx - px, yy - py) / rr; if (dd < 1) this.d[yy * N + xx] *= dd < 0.7 ? 0.02 : (dd - 0.7) / 0.3; }
  },
  clear() { this.d.fill(0); this.amount = 0; },
  render(dt = 1 / 60) {
    const c = this.ctx; if (this.amount <= 0) { if (this._drawn) { c.clearRect(0, 0, this.cv.width, this.cv.height); this._drawn = false; } return; }
    const N = this.N, D = this.d, px = this.img.data, k = Math.exp(-dt * 0.16), sub = dt * 0.018; let sum = 0;
    for (let i = 0; i < N * N; i++) { let v = D[i]; if (v > 0) { v = v * k - sub * (1.4 - this.cloud[i]); if (v < 0) v = 0; D[i] = v; sum += v; }
      const a = v * (0.55 + this.cloud[i] * 0.6); px[i * 4] = 236; px[i * 4 + 1] = 239; px[i * 4 + 2] = 243; px[i * 4 + 3] = Math.min(255, a * 215); }
    this.amount = sum > 2 ? 1 : 0; this.sctx.putImageData(this.img, 0, 0);
    const W = this.cv.width, g = Watch.geom(), cr = g.R * 0.845 * this.dp;
    c.clearRect(0, 0, W, W); c.save(); c.beginPath(); c.arc(W / 2, W / 2, cr, 0, TAU); c.clip(); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
    c.drawImage(this.small, 0, 0, W, W);
    if (!this.pat) this.pat = c.createPattern(this.grain, 'repeat');
    c.globalCompositeOperation = 'source-atop'; c.globalAlpha = 0.5; c.fillStyle = this.pat; c.fillRect(0, 0, W, W);
    c.restore(); this._drawn = true;
  }
};

/* ——— dial sketch overlay (charcoal on the crystal) ——— */
const DialInk = {
  cv: null, ctx: null, brush: null, on: false,
  init(canvas) { this.cv = canvas; this.ctx = canvas.getContext('2d'); this.resize(); this.brush = new CharcoalBrush(this.ctx, this.d); this.brush.color = '#1a1716'; },
  resize() { const css = this.cv.clientWidth || 600, d = Math.min(devicePixelRatio || 1, 2); let keep = null; if (this.cv.width) { keep = document.createElement('canvas'); keep.width = this.cv.width; keep.height = this.cv.height; keep.getContext('2d').drawImage(this.cv, 0, 0); }
    this.cv.width = css * d; this.cv.height = css * d; this.d = d; this.css = css; this.ctx.setTransform(d, 0, 0, d, 0, 0); if (keep) { this.ctx.save(); this.ctx.setTransform(1, 0, 0, 1, 0, 0); this.ctx.drawImage(keep, 0, 0, this.cv.width, this.cv.height); this.ctx.restore(); } if (this.brush) this.brush.dpr = d; },
  setOn(v) { this.on = v; this.cv.classList.toggle('active', v); document.body.classList.toggle('inking', v); },
  clear() { this.ctx.save(); this.ctx.setTransform(1, 0, 0, 1, 0, 0); this.ctx.clearRect(0, 0, this.cv.width, this.cv.height); this.ctx.restore(); },
  clipOK(x, y) { const g = Watch.geom(); return Math.hypot(x - g.cx, y - g.cy) < g.R * 0.83; }
};

/* ——— death's-head hawkmoths ——— */
const Moths = {
  cv: null, ctx: null, list: [], frames: [], mouse: { x: -999, y: -999, vx: 0, vy: 0, t: 0 }, hover: null, tip: null, d: 1,
  init() {
    this.cv = $('#moths'); this.ctx = this.cv.getContext('2d'); this.tip = $('#moth-tip'); this.resize(); this.makeFrames(); this.setCount(Settings.moths ? Settings.mothCount : 0);
    addEventListener('pointermove', e => { this.touch = e.pointerType === 'touch'; const m = this.mouse, now = performance.now(), dt = Math.max(1, now - m.t); m.vx = (e.clientX - m.x) / dt; m.vy = (e.clientY - m.y) / dt; m.x = e.clientX; m.y = e.clientY; m.t = now; }, { passive: true });
    addEventListener('pointerdown', e => { if (e.target.closest('button,input,select,textarea,a,.panel,canvas.sketch')) return; this.scatter(e.clientX, e.clientY); }, { passive: true });
  },
  resize() { this.d = Math.min(devicePixelRatio || 1, 2); this.cv.width = innerWidth * this.d; this.cv.height = innerHeight * this.d; },
  makeFrames() {
    const S = 64, F = 12;
    for (let f = 0; f < F; f++) {
      const c = document.createElement('canvas'); c.width = c.height = S * 2; const x = c.getContext('2d'); x.scale(2, 2); x.translate(S / 2, S / 2);
      const open = 0.25 + 0.75 * Math.abs(Math.cos(f / F * Math.PI));
      [-1, 1].forEach(sg => {
        x.save(); x.scale(sg * open, 1);
        // hindwing (ochre with black bands)
        x.beginPath(); x.moveTo(2, 2); x.bezierCurveTo(10, 0, 18, 6, 16, 12); x.bezierCurveTo(12, 16, 5, 13, 2, 8); x.closePath();
        const hg = x.createLinearGradient(2, 4, 16, 12); hg.addColorStop(0, '#3a2410'); hg.addColorStop(0.35, '#d99a2b'); hg.addColorStop(0.6, '#1c1208'); hg.addColorStop(0.75, '#e0a63a'); hg.addColorStop(1, '#2a1a0a'); x.fillStyle = hg; x.fill();
        // forewing (mottled umber)
        x.beginPath(); x.moveTo(2, -4); x.bezierCurveTo(10, -10, 22, -12, 29, -9); x.bezierCurveTo(27, -4, 22, 2, 13, 5); x.bezierCurveTo(8, 6, 4, 4, 2, 2); x.closePath();
        const fg = x.createLinearGradient(2, -6, 28, -6); fg.addColorStop(0, '#2b1d12'); fg.addColorStop(0.4, '#5a4330'); fg.addColorStop(0.7, '#3a2a1c'); fg.addColorStop(1, '#6c5440'); x.fillStyle = fg; x.fill();
        x.strokeStyle = 'rgba(210,180,140,.35)'; x.lineWidth = 0.5; x.beginPath(); x.moveTo(6, -3); x.quadraticCurveTo(16, -6, 26, -8); x.moveTo(8, 1); x.quadraticCurveTo(16, -1, 23, -4); x.stroke();
        x.fillStyle = 'rgba(230,210,170,.5)'; x.beginPath(); x.arc(14, -4, 1.1, 0, TAU); x.fill();
        x.restore();
      });
      // body: thorax with pale skull-like marking, banded abdomen
      x.fillStyle = '#20160e'; x.beginPath(); x.ellipse(0, -2, 3.4, 5, 0, 0, TAU); x.fill();
      x.fillStyle = '#e6d3a8'; x.beginPath(); x.ellipse(0, -2.6, 2.1, 2.4, 0, 0, TAU); x.fill();
      x.fillStyle = '#20160e'; x.beginPath(); x.arc(-0.8, -3, 0.55, 0, TAU); x.arc(0.8, -3, 0.55, 0, TAU); x.fill();
      for (let k = 0; k < 6; k++) { x.fillStyle = k % 2 ? '#1a120a' : '#d4a03a'; x.beginPath(); x.ellipse(0, 3 + k * 1.9, 2.8 - k * 0.35, 1.1, 0, 0, TAU); x.fill(); }
      x.fillStyle = '#20160e'; x.beginPath(); x.arc(0, -7.2, 1.8, 0, TAU); x.fill();
      x.strokeStyle = '#3a2a1a'; x.lineWidth = 0.6; x.beginPath(); x.moveTo(-0.8, -8.5); x.quadraticCurveTo(-3, -12, -4, -13); x.moveTo(0.8, -8.5); x.quadraticCurveTo(3, -12, 4, -13); x.stroke();
      this.frames.push(c);
    }
  },
  setCount(n) {
    const W = innerWidth, H = innerHeight;
    while (this.list.length < n) this.list.push({ x: Math.random() * W, y: Math.random() * H, vx: rand(-1, 1), vy: rand(-1, 1), ph: Math.random() * 12, s: rand(0.55, 1.05), orbit: rand(0.95, 1.65), dir: Math.random() < 0.5 ? 1 : -1, rest: 0, seed: Math.random() * 100 });
    this.list.length = n; if (!n) this.ctx.clearRect(0, 0, this.cv.width, this.cv.height);
  },
  scatter(x, y) { this.list.forEach(m => { const dx = m.x - x, dy = m.y - y, d = Math.hypot(dx, dy) || 1; if (d < 260) { m.vx += dx / d * 9; m.vy += dy / d * 9; } }); },
  update(dt, t) {
    const L = this.list; if (!L.length) { this.tip.classList.remove('show'); return; }
    const c = this.ctx, st = $('#stage-watch').getBoundingClientRect(), wx = st.left + st.width / 2, wy = st.top + st.height / 2, wr = st.width * 0.36;
    const mo = this.mouse, speed = Math.hypot(mo.vx, mo.vy); let hov = null, hd = 22; const small = innerWidth < 900, sc = small ? 0.62 : 1;
    if (!this._pr || t - this._prt > 0.5) { const pe = $('#panel'); this._pr = !small && pe ? pe.getBoundingClientRect() : null; this._prt = t; } const pr = this._pr;
    c.setTransform(this.d, 0, 0, this.d, 0, 0); c.clearRect(0, 0, innerWidth, innerHeight);
    for (const m of L) {
      const dx = m.x - mo.x, dy = m.y - mo.y, dm = Math.hypot(dx, dy);
      if (!this.touch && dm < hd && speed < 0.6) { hov = m; hd = dm; }
      if (m === this.hover && dm < 40 && speed < 0.6) { m.vx *= 0.8; m.vy *= 0.8; m.ph += dt * 3; }
      else {
        // orbit the "lamp" (the watch) with wandering noise
        const ox = m.x - wx, oy = m.y - wy, od = Math.hypot(ox, oy) || 1, targetR = wr * m.orbit;
        const radial = (targetR - od) * 0.0009, tang = 0.035 * m.dir;
        m.vx += (ox / od) * radial * 60 * dt + (-oy / od) * tang * 60 * dt; m.vy += (oy / od) * radial * 60 * dt + (ox / od) * tang * 60 * dt;
        m.vx += Math.sin(t * 1.3 + m.seed) * 0.05; m.vy += Math.cos(t * 1.1 + m.seed * 2) * 0.05;
        if (dm < 120) { const f = (120 - dm) / 120 * (0.5 + speed * 1.8); m.vx += dx / (dm || 1) * f; m.vy += dy / (dm || 1) * f; }
        if (pr && m.x > pr.left - 30 && m.y > pr.top - 30 && m.y < pr.bottom + 30) { m.vx -= 0.35; }
        const sp = Math.hypot(m.vx, m.vy), max = 3.4; if (sp > max) { m.vx *= max / sp; m.vy *= max / sp; }
        m.vx *= 0.985; m.vy *= 0.985; m.x += m.vx * 60 * dt; m.y += m.vy * 60 * dt; m.ph += dt * (14 + sp * 3);
      }
      const ang = Math.atan2(m.vy, m.vx) + Math.PI / 2, fr = this.frames[Math.floor(m.ph) % this.frames.length], size = 46 * m.s * sc;
      c.save(); c.translate(m.x, m.y); c.rotate(ang); c.globalAlpha = 0.92;
      c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 8; c.shadowOffsetY = 6;
      c.drawImage(fr, -size / 2, -size / 2, size, size); c.restore();
    }
    this.hover = hov;
    if (hov) { this.tip.style.transform = `translate(${hov.x + 16}px, ${hov.y - 34}px)`; this.tip.classList.add('show'); } else this.tip.classList.remove('show');
  }
};

/* ——— night-vision grain ——— */
const NVGrain = {
  cv: null, ctx: null, id: null, t: 0,
  init() { this.cv = $('#nv-grain'); this.cv.width = 240; this.cv.height = 150; this.ctx = this.cv.getContext('2d'); this.id = this.ctx.createImageData(240, 150); },
  render(t) {
    if (!Watch.theme.nv || !Settings.nvNoise) return; if (t - this.t < 0.05) return; this.t = t;
    const d = this.id.data; for (let i = 0; i < d.length; i += 4) { const v = Math.random() * 255; d[i] = v * 0.6; d[i + 1] = v; d[i + 2] = v * 0.55; d[i + 3] = 60; }
    this.ctx.putImageData(this.id, 0, 0);
  }
};
