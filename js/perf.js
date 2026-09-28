/* Performance governor: measures real frame pacing (60 or 120 Hz), steps render quality down or up,
   caps canvas resolution, and drives the optional FPS meter. Settings › Performance: Auto / Smooth / Beautiful. */
'use strict';
Object.assign(DEFAULTS, { perf: 'auto', fpsMeter: false, haptics: true, parallax: true, candle: true, autoTheme: false });
Object.keys(DEFAULTS).forEach(k => { if (!(k in Settings)) Settings[k] = DEFAULTS[k]; });

const Perf = {
  mobile: (matchMedia && matchMedia('(pointer: coarse)').matches) || Math.min(screen.width, screen.height) < 820,
  level: 2, hz: 60, q: null, iv: [], work: [], hzSamples: [], lastEval: 0, lastStep: 0, upBlockedUntil: 0, frameN: 0, meter: null, _mt: 0,
  /* quality tiers. lightSteps: how finely the cached lighting follows the light direction. */
  LEVELS: [
    { name: 'Smooth', dpr: 1.5, blur: false, moths: [4, 8], lightSteps: 40, ghosts: 1, grain: false, spring: 120, fog: 96, half: true },
    { name: 'Balanced', dpr: 2, blur: true, moths: [7, 14], lightSteps: 90, ghosts: 2, grain: true, spring: 200, fog: 128, half: true },
    { name: 'Beautiful', dpr: 2.5, blur: true, moths: [12, 99], lightSteps: 180, ghosts: 4, grain: true, spring: 360, fog: 128, half: false }
  ],
  init() {
    const m = Settings.perf; this.level = m === 'smooth' ? 0 : m === 'beautiful' ? 2 : (this.mobile ? 1 : 2);
    this.apply(true);
    if (Settings.fpsMeter || /[?&]fps\b/.test(location.search)) this.showMeter(true);
    Bus.on('setting:perf', (v) => { this.level = v === 'smooth' ? 0 : v === 'beautiful' ? 2 : (this.mobile ? 1 : 2); this.upBlockedUntil = 0; this.apply(); });
    Bus.on('setting:fpsMeter', (v) => this.showMeter(v));
  },
  /* canvas backing-store scale: never the full DPR 3 of a phone unless the owner asks for Beautiful */
  dpr() {
    const d = window.devicePixelRatio || 1, L = this.LEVELS[this.level];
    let cap = L.dpr; if (Settings.perf === 'beautiful') cap = this.mobile ? 3 : 3; else if (this.mobile && this.level === 2) cap = 2;
    return Math.min(d, cap);
  },
  mothCap() { return this.q.moths[this.mobile ? 0 : 1]; },
  apply(first) {
    this.q = Object.assign({}, this.LEVELS[this.level]);
    document.documentElement.dataset.q = this.level;
    if (document.body) { document.body.classList.toggle('lowfx', this.level === 0); document.body.classList.toggle('q2', this.level === 2); }
    if (!first) Bus.emit('quality', this.level);
  },
  step(dir) {
    const n = clamp(this.level + dir, 0, 2); if (n === this.level) return; this.level = n; this.lastStep = performance.now(); this.iv = []; this.work = [];
    if (dir > 0) this.upAt = performance.now(); else if (this.upAt && performance.now() - this.upAt < 12000) this.upBlockedUntil = performance.now() + 90000;
    this.apply();
  },
  /* called once per animation frame with the rAF interval and the time our own code spent */
  frame(intervalMs, workMs) {
    if (intervalMs <= 0 || intervalMs > 250) return; this.frameN++;
    if (this.frameN > 20 && this.hzSamples.length < 120) { this.hzSamples.push(intervalMs); if (this.hzSamples.length === 120) { const s = this.hzSamples.slice().sort((a, b) => a - b), med = s[60]; this.hz = med < 10.5 ? 120 : med < 14 ? 90 : 60; } }
    this.iv.push(intervalMs); this.work.push(workMs); if (this.iv.length > 240) { this.iv.shift(); this.work.shift(); }
    const now = performance.now();
    if (this.meter && now - this._mt > 500) { this._mt = now; this.drawMeter(); }
    if (Settings.perf !== 'auto' || document.hidden) return; const span = this.iv.reduce((a, b) => a + b, 0);
    // evaluate every 1.5 s once we have a second of samples; a badly struggling scene is re-checked sooner so it recovers quickly
    if (span < 1000 || this.iv.length < 12 || (now - this.lastEval < 1500 && !(span / this.iv.length > 2000 / this.hz && now - this.lastEval > 700))) return; this.lastEval = now;
    const budget = 1000 / this.hz, n = this.iv.length, avg = this.iv.reduce((a, b) => a + b, 0) / n, slow = this.iv.filter(x => x > budget * 1.6).length / n;
    const w = this.work.reduce((a, b) => a + b, 0) / n, maxLvl = 2;
    if (avg > budget * 2.4 && this.level > 0 && now - this.lastStep > 900) this.step(-2);
    else if ((avg > budget * 1.3 || slow > 0.2 || w > budget * 0.75) && now - this.lastStep > 1800) this.step(-1);
    else if (this.level < maxLvl && avg < budget * 1.08 && slow < 0.03 && w < budget * 0.3 && now - this.lastStep > 8000 && now > this.upBlockedUntil) this.step(1);
  },
  stats() { const n = this.iv.length || 1, avg = this.iv.reduce((a, b) => a + b, 0) / n, s = this.iv.slice().sort((a, b) => a - b); return { fps: avg ? 1000 / avg : 0, p95: s[Math.floor(s.length * 0.95)] || 0, work: this.work.reduce((a, b) => a + b, 0) / n }; },
  showMeter(on) {
    if (!on) { if (this.meter) { this.meter.remove(); this.meter = null; } return; }
    if (this.meter) return; this.meter = el('div', { id: 'fps-meter', 'aria-hidden': 'true' }); document.body.appendChild(this.meter); this.drawMeter();
  },
  drawMeter() { const s = this.stats(); this.meter.innerHTML = `<b>${s.fps.toFixed(0)}</b> fps · ${this.hz} Hz<br>p95 ${s.p95.toFixed(1)} ms · js ${s.work.toFixed(1)} ms<br>${this.q.name}${Settings.perf === 'auto' ? ' (auto)' : ''} · ${this.dpr().toFixed(2)}×`; }
};

/* Haptics: navigator.vibrate where it exists (Android); on iPhone Safari 18+ a hidden switch control gives a light tap. */
const Haptics = {
  sw: null,
  init() {
    if (navigator.vibrate || !/iP(hone|ad|od)/.test(navigator.userAgent)) return;
    const lab = el('label', { 'aria-hidden': 'true', style: 'position:fixed;left:-99px;top:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none' });
    lab.innerHTML = '<input type="checkbox" switch tabindex="-1">'; document.body.appendChild(lab); this.sw = lab;
  },
  tap(kind = 'light') {
    if (!Settings.haptics) return;
    const pat = { light: 8, medium: 16, heavy: 28, double: [10, 40, 10], tick: 5, select: 6, detent: 4, press: 14, success: [12, 60, 24] }[kind] || 8;
    try { if (navigator.vibrate) navigator.vibrate(pat); else if (this.sw) this.sw.click(); } catch (e) {}
  }
};
