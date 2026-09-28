/* v3 visuals: tilt parallax across depth layers, candlelight flicker, a warm crystal glint, sunset-driven dial theme,
   the compact view, and iPhone motion permission. All animation here writes only transform/opacity. */
'use strict';
const Parallax = {
  els: null, last: '',
  init() {
    this.els = { bg: $('#bg'), candle: $('#candle'), shadow: $('.w-shadow'), ring: $('#bezel-ring'), moths: $('#moths') };
    Bus.on('setting:parallax', (v) => { if (!v) this.reset(); });
  },
  reset() { const E = this.els; if (!E) return; ['bg', 'candle', 'shadow', 'moths'].forEach(k => { if (E[k]) E[k].style.transform = ''; }); this.last = ''; },
  set(tx, ty) {
    if (!this.els || !Settings.parallax || Settings.reducedMotion) return;
    const x = ty, y = tx, key = (x * 4 | 0) + ',' + (y * 4 | 0); if (key === this.last) return; this.last = key; const E = this.els;
    // far → near: the backdrop drifts against the tilt, the candle a little, the contact shadow slides away from the light, moths drift with it
    if (E.bg) E.bg.style.transform = `translate3d(${(-x * 1.6).toFixed(1)}px, ${(y * 1.6).toFixed(1)}px, 0) scale(1.04)`;
    if (E.candle) E.candle.style.transform = `translate3d(${(-x * 3).toFixed(1)}px, ${(y * 3).toFixed(1)}px, 0)`;
    if (E.shadow) E.shadow.style.transform = `translate3d(${(-x * 1.4).toFixed(1)}px, ${(8 + y * 1.2).toFixed(1)}px, 0)`;
    if (E.moths) E.moths.style.transform = `translate3d(${(x * 2.4).toFixed(1)}px, ${(-y * 2.4).toFixed(1)}px, 0)`;
  }
};

/* Candlelight: a warm pool of light at the upper left and a glint on the crystal. The flicker itself is a CSS keyframe
   animation on opacity, so the compositor runs it with no main-thread work; the Smooth tier switches it off. */
const Candle = {
  el: null, glint: null,
  init() {
    this.el = $('#candle'); this.glint = $('#glint');
    const on = () => document.body.classList.toggle('candle-on', !!Settings.candle && !Settings.reducedMotion);
    Bus.on('setting:candle', on); Bus.on('setting:reducedMotion', on); on();
  },
  frame() {},
  // the glint follows the dial's light direction (rotation of an off-centre gradient: one composited transform)
  aim(L) { if (!this.glint || !Settings.candle) return; const d = Math.round(L * 180 / Math.PI / 2) * 2; if (d === this._d) return; this._d = d; this.glint.style.transform = `rotate(${d}deg)`; }
};

/* Dark after sunset, light after sunrise (Settings › Dark after sunset). Uses the location set in Sole. */
const AutoTheme = {
  init() { Bus.on('setting:autoTheme', (v) => { if (v) this.check(true); }); setInterval(() => this.check(), 60000); setTimeout(() => this.check(false), 1500); },
  day(now) { const L = Loc.get(), key = now.toDateString() + L.lat + L.lon; if (this._k !== key) { this._k = key; this._d = solarDay(now, L.lat, L.lon); } return this._d; },
  isNight(now = new Date()) { const d = this.day(now); if (!d.rise || !d.set) return d.noonAlt < 0; return now < d.rise || now > d.set; },
  check(announce) {
    if (!Settings.autoTheme || Night.on) return; const night = this.isNight(), cur = Settings.theme, L = Loc.get();
    // act only when enabled or when day turns to night (and back), so a dial chosen by hand is respected until the next sunset or sunrise
    if (announce !== true && night === this._night) return; this._night = night;
    if (night && cur === 'ivory') { App.setTheme(Settings.lastDark || 'florence'); if (announce !== false) toast(`Sunset in ${L.name}: ${THEMES[Settings.theme].name}`); }
    else if (!night && cur !== 'ivory' && cur !== 'nv') { setSetting('lastDark', cur); App.setTheme('ivory'); if (announce !== false) toast(`Sunrise in ${L.name}: Bone Ivory`); }
    else if (announce === true) toast(night ? 'It is night here, so the dial stays dark' : 'It is day here, so the dial stays light');
  }
};

/* ?view=compact: only the watch, the ring name and the arrows */
const Compact = {
  init() { if (/[?&]view=compact\b/.test(location.search)) this.set(true, true); const x = $('#compact-exit'); if (x) x.onclick = () => this.set(false); },
  set(on, quiet) {
    document.body.classList.toggle('compact', on); if (!quiet) toast(on ? 'Compact view · press Esc or the × to leave' : 'Full view');
    try { const u = new URL(location.href); if (on) u.searchParams.set('view', 'compact'); else u.searchParams.delete('view'); history.replaceState(null, '', u); } catch (e) { /* file:// */ }
    setTimeout(() => App.layout(), 60);
  },
  on() { return document.body.classList.contains('compact'); }
};

/* iOS 13+: motion sensors need a permission prompt from a tap. Offered, never forced. */
const Motion = {
  needs() { return typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function'; },
  ask() {
    if (!this.needs()) { toast('Tilt the device to move the light'); return; }
    DeviceOrientationEvent.requestPermission().then(r => { toast(r === 'granted' ? 'Tilt enabled: move the phone to move the light' : 'Motion access was declined'); if (r === 'granted') setSetting('motionOK', true); }).catch(() => toast('Motion access needs a tap on the page'));
  }
};
