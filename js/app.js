/* Orchestration: bezel selector, main loop, gestures, keyboard, persistence. */
'use strict';
const App = {
  cur: -1, flipA: 0, flipT: 0, tiltX: 0, tiltY: 0, tiltTX: 0, tiltTY: 0, lastSec: -1, lastHourChimed: -1, built: new Set(), lastT: performance.now(),
  init() {
    Watch.init($('#watch')); CaseBack.init($('#caseback')); Fog.init($('#fog')); DialInk.init($('#dialink'));
    Backdrop.init(); if (innerWidth < 900 && Store.get('settings', {}).mothCount == null) Settings.mothCount = 12; Moths.init(); NVGrain.init();
    this.buildBezel(); this.buildPanels(); this.bind(); this.layout();
    this.applyAccent(Settings.theme); document.body.classList.toggle('nv', !!Watch.theme.nv); document.body.classList.toggle('reduced', Settings.reducedMotion);
    const start = MODES.findIndex(m => m.id === Settings.mode); this.go(start >= 0 && Settings.mode !== 'back' ? start : 0, true);
    Bus.on('setting', (k, v) => this.onSetting(k, v));
    Bus.on('alarms', () => this.syncAlarm()); this.syncAlarm();
    if (document.fonts && document.fonts.load) Promise.all(['700 20px Cinzel', '20px "Pinyon Script"', '20px "Cormorant Garamond"', '20px "Special Elite"'].map(f => document.fonts.load(f))).then(() => { Watch.build(); CaseBack.layers = {}; Backdrop.draw(); }).catch(() => {});
    requestAnimationFrame((t) => this.loop(t));
    if (!/noboot/.test(location.search) && !sessionStorage.getItem('lecter.introShown')) this.intro(); else $('#intro').remove();
  },
  intro(force) {
    let el = $('#intro'); if (!el) { el = document.createElement('div'); el.id = 'intro'; el.innerHTML = INTRO_HTML; document.body.appendChild(el); }
    el.classList.remove('gone'); requestAnimationFrame(() => el.classList.add('play'));
    const enter = () => { Snd.ensure(); [55, 62, 67, 71, 74, 79].forEach((m, i) => Snd.pluck(m, Snd.ctx.currentTime + 0.05 + i * 0.07, 0.6, 0, Snd.sfx)); el.classList.add('gone'); sessionStorage.setItem('lecter.introShown', '1'); setTimeout(() => el.remove(), 900); removeEventListener('keydown', key); };
    const key = (e) => { if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') { e.preventDefault(); enter(); } };
    $('#intro-enter', el).onclick = enter; addEventListener('keydown', key);
  },
  buildBezel() {
    const ring = $('#bezel-ring'), n = MODES.length;
    MODES.forEach((m, i) => {
      const b = el('button', { class: 'bz-item', 'data-i': i, 'aria-label': m.name + ' — ' + m.label, title: m.name });
      b.innerHTML = `<span class="bz-in">${svgIcon(m.icon)}<em>${m.label}</em></span>`; b.style.setProperty('--a', (i * 360 / n) + 'deg');
      b.onclick = () => this.go(i); ring.appendChild(b);
    });
    for (let k = 0; k < n * 4; k++) { const t = el('i', { class: 'bz-tick' + (k % 4 ? '' : ' maj') }); t.style.setProperty('--a', (k * 90 / n) + 'deg'); ring.appendChild(t); }
    const dock = $('#mode-dock'); MODES.forEach((m, i) => { const b = el('button', { 'data-i': i, title: m.name, 'aria-label': m.name }); b.innerHTML = svgIcon(m.icon) + `<span>${m.label}</span>`; b.onclick = () => this.go(i); dock.appendChild(b); });
  },
  buildPanels() { const body = $('#panel-body'); MODES.forEach(m => { const s = el('section', { class: 'mode-sec', 'data-id': m.id }); body.appendChild(s); m.el = s; }); },
  go(i, instant) {
    const n = MODES.length; i = ((i % n) + n) % n; if (i === this.cur) return;
    const prev = MODES[this.cur]; if (prev) { prev.el.classList.remove('on'); if (prev.hide) prev.hide(); }
    const m = MODES[i];
    if (!this.built.has(m.id)) { m.build(m.el); this.built.add(m.id); }
    // shortest rotation for the ring
    const step = 360 / n; let target = -i * step; if (this.ringRot != null) { while (target - this.ringRot > 180) target -= 360; while (target - this.ringRot < -180) target += 360; }
    this.ringRot = target; $('#bezel-ring').style.setProperty('--rot', target + 'deg'); if (instant) $('#bezel-ring').classList.add('instant'); else $('#bezel-ring').classList.remove('instant');
    $$('.bz-item').forEach((b, k) => b.classList.toggle('on', k === i)); $$('#mode-dock button').forEach((b, k) => b.classList.toggle('on', k === i));
    const db = $(`#mode-dock button[data-i="${i}"]`); if (db && db.scrollIntoView && !instant) db.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    $('#p-kicker').textContent = m.kicker; $('#p-title').textContent = m.name; $('#p-sub').textContent = m.sub; $('#mode-name').innerHTML = `<b>${m.name}</b><small>${i + 1} / ${n}</small>`;
    m.el.classList.add('on'); this.cur = i; if (m.show) m.show(); if (m.tick) m.tick(new Date());
    $('#panel').classList.remove('swap'); void $('#panel').offsetWidth; $('#panel').classList.add('swap');
    if (m.id !== 'back') setSetting('mode', m.id);
    if (!instant) { Snd.tick(0.18); Watch.crownRot += 6; }
  },
  flip(v) { this.flipT = (v == null ? this.flipT < 90 : v) ? 180 : 0; if (Settings.reducedMotion) this.flipA = this.flipT; },
  setTheme(id) {
    setSetting('theme', id); Watch.setTheme(id); CaseBack.layers = {}; Backdrop.draw(); document.body.classList.toggle('nv', !!Watch.theme.nv);
    this.applyAccent(id); toast(THEMES[id].name);
  },
  applyAccent(id) { document.documentElement.style.setProperty('--accent', { nv: '#6fdc6a', ivory: '#8a1e1e', crimson: '#c89b62', moth: '#d9a441' }[id] || '#b3202a'); },
  cycleTheme(d = 1) { const i = THEME_ORDER.indexOf(Settings.theme); this.setTheme(THEME_ORDER[(i + d + THEME_ORDER.length) % THEME_ORDER.length]); },
  onSetting(k, v) {
    if (k === 'moths' || k === 'mothCount') Moths.setCount(Settings.moths && !Settings.reducedMotion ? Settings.mothCount : 0);
    if (k === 'reducedMotion') { document.body.classList.toggle('reduced', v); Moths.setCount(Settings.moths && !v ? Settings.mothCount : 0); }
    if (k === 'fog' && !v) Fog.clear();
    if (k === 'h24') { const m = MODES[this.cur]; if (m.tick) { m._s = -1; m.tick(new Date()); } }
  },
  syncAlarm() { const n = Alarms.next(); Watch.state.alarm = n ? { h: n.at.getHours(), m: n.at.getMinutes() } : null; },
  fullscreen() { const d = document; if (!d.fullscreenElement) { (d.documentElement.requestFullscreen || d.documentElement.webkitRequestFullscreen || (() => toast('Fullscreen is not available'))).call(d.documentElement); } else (d.exitFullscreen || d.webkitExitFullscreen).call(d); },
  help() { $('#help').classList.toggle('show'); },
  layout() {
    const st = $('#stage'), mobile = innerWidth < 900, w = st.clientWidth, h = mobile ? innerHeight * 0.7 : st.clientHeight;
    const S = Math.floor(Math.min(w / (mobile ? 1.2 : 1.3), (h - (mobile ? 70 : 110)) / 1.22, 720));
    document.documentElement.style.setProperty('--S', S + 'px');
    requestAnimationFrame(() => { Watch.resize(); CaseBack.resize(); Fog.resize(); DialInk.resize(); Moths.resize(); Backdrop.draw(); });
  },
  local(e) { const r = $('#watch').getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * Watch.W, y: (e.clientY - r.top) / r.height * Watch.W }; },
  bind() {
    addEventListener('resize', () => { clearTimeout(this._rz); this._rz = setTimeout(() => this.layout(), 120); });
    // light follows pointer
    addEventListener('pointermove', (e) => {
      const r = $('#stage-watch').getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, dx = e.clientX - cx, dy = e.clientY - cy;
      if (Settings.lightFollow && e.pointerType !== 'touch') Watch.lightTarget = Math.atan2(dx, -dy);
      if (!Settings.reducedMotion && e.pointerType !== 'touch') { this.tiltTY = clamp(dx / innerWidth * 14, -7, 7); this.tiltTX = clamp(-dy / innerHeight * 10, -5, 5); }
    }, { passive: true });
    const sw = $('#stage-watch'); let drag = null, press = null;
    sw.addEventListener('pointerdown', (e) => {
      Snd.ensure(); const p = this.local(e), g = Watch.geom(), dx = p.x - g.cx, dy = p.y - g.cy, R = g.R, dist = Math.hypot(dx, dy);
      if (this.flipT === 180) { drag = { x: e.clientX, y: e.clientY, a: Math.atan2(dy, dx) }; sw.setPointerCapture(e.pointerId); return; }
      if (DialInk.on && dist < R * 0.83) { sw.setPointerCapture(e.pointerId); DialInk.brush.down(p.x, p.y, 0.6); drag = { ink: true }; e.preventDefault(); return; }
      // case hardware
      const hit = (ang, rr, rad) => Math.hypot(dx - Math.cos(ang) * rr, dy - Math.sin(ang) * rr) < rad;
      if (hit(-Math.PI / 6, R * 1.02, R * 0.1)) { const cm = MODES.findIndex(m => m.id === 'chrono'); if (this.cur !== cm) this.go(cm); Chrono.toggle(); return; }
      if (hit(Math.PI / 6, R * 1.02, R * 0.1)) { const cm = MODES.findIndex(m => m.id === 'chrono'); if (this.cur !== cm) this.go(cm); Chrono.lapOrReset(); return; }
      if (hit(0, R * 1.08, R * 0.12)) { this.go(this.cur + 1); CaseBack.wind(0.03); return; }
      press = { x: e.clientX, y: e.clientY, t: performance.now(), inCrystal: dist < R * 0.84, fog: Fog.amount > 0.05, moved: false, type: e.pointerType };
      if (press.inCrystal && e.pointerType !== 'mouse') { clearTimeout(this._lp); this._lp = setTimeout(() => { if (press && !press.moved) { Fog.breathe(); press.fog = true; } }, 650); }
    });
    sw.addEventListener('pointermove', (e) => {
      const p = this.local(e), g = Watch.geom();
      if (drag && drag.ink) { if (DialInk.clipOK(p.x, p.y)) DialInk.brush.move(p.x, p.y, 0.6); else DialInk.brush.up(); return; }
      if (drag) { const a = Math.atan2(p.y - g.cy, p.x - g.cx); let da = a - drag.a; if (da > Math.PI) da -= TAU; if (da < -Math.PI) da += TAU; CaseBack.dragV += da * 2.2; drag.a = a; return; }
      if (press) { if (Math.hypot(e.clientX - press.x, e.clientY - press.y) > 8) press.moved = true; }
      const hovering = e.pointerType === 'mouse' || (press && press.fog && press.inCrystal);
      if (hovering && Fog.amount > 0.01 && Math.hypot(p.x - g.cx, p.y - g.cy) < g.R * 0.9) Fog.wipe(p.x, p.y, e.pointerType === 'mouse' ? 0.06 : 0.08);
    });
    const end = (e) => {
      clearTimeout(this._lp);
      if (drag && drag.ink) DialInk.brush.up(); drag = null;
      if (press && e.type === 'pointerup') { const dx = e.clientX - press.x, dy = e.clientY - press.y, dt = performance.now() - press.t;
        if (press.type !== 'mouse' && !(press.fog && press.inCrystal) && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4 && dt < 700) this.go(this.cur + (dx < 0 ? 1 : -1));
        else if (press.type === 'mouse' && !press.moved && press.inCrystal && dt < 300 && this.cur === 0) { /* tap on dial: nothing */ } }
      press = null;
    };
    sw.addEventListener('pointerup', end); sw.addEventListener('pointercancel', end);
    sw.addEventListener('dblclick', () => { if (!DialInk.on) this.flip(); });
    // stage swipe outside watch (touch)
    const stage = $('#stage'); let ts = null;
    stage.addEventListener('touchstart', (e) => { if (e.target.closest('#stage-watch')) return; const t = e.touches[0]; ts = { x: t.clientX, y: t.clientY, t: performance.now() }; }, { passive: true });
    stage.addEventListener('touchend', (e) => { if (!ts) return; const t = e.changedTouches[0], dx = t.clientX - ts.x, dy = t.clientY - ts.y; if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4 && performance.now() - ts.t < 700) this.go(this.cur + (dx < 0 ? 1 : -1)); ts = null; }, { passive: true });
    // wheel = turn the bezel
    let acc = 0; $('#stage').addEventListener('wheel', (e) => { e.preventDefault(); acc += e.deltaY; Watch.crownRot += e.deltaY * 0.05; if (Math.abs(acc) > 70) { this.go(this.cur + Math.sign(acc)); acc = 0; } }, { passive: false });
    // quick dock
    $$('[data-act]').forEach(b => b.addEventListener('click', () => this.act(b.dataset.act)));
    document.addEventListener('click', (e) => { const b = e.target.closest('[data-act]'); if (b && !b._bound && b.closest('#panel-body')) { this.act(b.dataset.act); } });
    $('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal' && !Alarms.ringing) Modal.close(); });
    $('#help').addEventListener('click', (e) => { if (e.target.id === 'help' || e.target.closest('.close')) this.help(); });
    $('#m-prev').onclick = () => this.go(this.cur - 1); $('#m-next').onclick = () => this.go(this.cur + 1);
    addEventListener('keydown', (e) => this.key(e));
    // tilt → light & rotor gravity
    addEventListener('deviceorientation', (e) => {
      if (e.gamma == null) return; const gx = clamp(e.gamma / 45, -1, 1), gy = clamp((e.beta - 35) / 45, -1, 1);
      if (Settings.lightFollow) Watch.lightTarget = Math.atan2(-gx, gy) + Math.PI; this.tiltTY = gx * 6; this.tiltTX = -gy * 4;
      CaseBack.grav = Math.hypot(gx, gy) > 0.15 ? Math.atan2(-gx, gy) : null;
    });
    document.addEventListener('visibilitychange', () => { this.lastT = performance.now(); });
    document.addEventListener('fullscreenchange', () => setTimeout(() => this.layout(), 150));
  },
  act(a) {
    Snd.ensure();
    if (a === 'flip') this.flip(); else if (a === 'breathe') Fog.breathe(); else if (a === 'moths') { setSetting('moths', !Settings.moths); toast(Settings.moths ? 'The moths return' : 'The moths depart'); }
    else if (a === 'theme') this.cycleTheme(1); else if (a === 'fullscreen') this.fullscreen(); else if (a === 'help') this.help();
  },
  key(e) {
    if (e.target.closest && e.target.closest('input, textarea, select')) { if (e.key === 'Escape') e.target.blur(); return; }
    if ($('#intro') && !$('#intro').classList.contains('gone')) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const m = MODES[this.cur]; Snd.ensure();
    if (e.key === 'Escape') { if ($('#help').classList.contains('show')) this.help(); else if ($('#modal').classList.contains('show') && !Alarms.ringing) Modal.close(); else if (DialInk.on) { DialInk.setOn(false); const c = $('#sk-dial'); if (c) c.checked = false; } else if (this.flipT) this.flip(false); return; }
    if (m.key && m.key(e)) { e.preventDefault(); return; }
    const k = e.key;
    if (k === 'ArrowRight' || k === ']') { this.go(this.cur + 1); e.preventDefault(); }
    else if (k === 'ArrowLeft' || k === '[') { this.go(this.cur - 1); e.preventDefault(); }
    else if (/^[0-9]$/.test(k)) this.go(k === '0' ? 9 : +k - 1);
    else if (k === 't') this.cycleTheme(1); else if (k === 'T') this.cycleTheme(-1);
    else if (k === 'h' || k === 'H') { setSetting('h24', !Settings.h24); toast(Settings.h24 ? '24-hour time' : '12-hour time'); }
    else if (k === 'f' || k === 'F') this.fullscreen();
    else if (k === 'b' || k === 'B') Fog.breathe();
    else if (k === 'm' || k === 'M') this.act('moths');
    else if (k === 'k' || k === 'K') this.flip();
    else if (k === 'p' || k === 'P') { const mu = MODES.find(x => x.id === 'music'); if (!this.built.has('music')) { mu.build(mu.el); this.built.add('music'); } mu.toggle(); toast(Player.playing ? 'Harpsichord: ' + Player.piece.name : 'Music paused'); }
    else if (k === '?' || k === '/') this.help();
    else if (e.code === 'Space') { e.preventDefault(); Chrono.toggle(); toast(Chrono.s.running ? 'Chronograph running' : 'Chronograph stopped'); }
  },
  loop(t) {
    const dt = Math.min(0.1, (t - this.lastT) / 1000); this.lastT = t; const now = new Date();
    // flip & tilt
    this.flipA += (this.flipT - this.flipA) * Math.min(1, dt * 5.5); if (Math.abs(this.flipT - this.flipA) < 0.05) this.flipA = this.flipT;
    this.tiltX += (this.tiltTX - this.tiltX) * dt * 4; this.tiltY += (this.tiltTY - this.tiltY) * dt * 4;
    const pop = Math.sin(this.flipA / 180 * Math.PI) * 0.06;
    $('#watch3d').style.transform = `scale(${1 - pop}) rotateX(${this.tiltX.toFixed(2)}deg) rotateY(${(this.flipA + this.tiltY).toFixed(2)}deg)`;
    // state for the dial
    Watch.state.chrono.elapsed = Chrono.elapsed(); Watch.state.chrono.running = Chrono.s.running;
    Watch.state.timer = Countdown.active() ? { active: true, frac: Countdown.frac() } : null;
    const frontVisible = this.flipA < 95, backVisible = this.flipA > 85;
    if (frontVisible) { Watch.render(now); Fog.render(dt); }
    if (backVisible) CaseBack.render(now);
    if (!Settings.reducedMotion) Moths.update(dt, t / 1000); NVGrain.render(t / 1000);
    const m = MODES[this.cur]; if (m.tick && (!this._tk || t - this._tk > 90)) { this._tk = t; m.tick(now); } if (m.frame) m.frame(dt);
    // once per second
    if (now.getSeconds() !== this.lastSec) {
      this.lastSec = now.getSeconds(); Countdown.check(); Alarms.check(now); if (this.lastSec % 20 === 0) this.syncAlarm();
      if (Settings.tick && Snd.ctx) Snd.tick(0.1);
      if (Settings.hourlyChime && now.getMinutes() === 0 && this.lastHourChimed !== now.getHours()) { this.lastHourChimed = now.getHours(); Snd.chime(now.getHours() % 12 || 12); }
    }
    requestAnimationFrame((tt) => this.loop(tt));
  }
};
const INTRO_HTML = `<div class="intro-inner"><div class="i1">CINCO CORPORATION</div><div class="i2">presents</div><div class="i3">The Lecter</div><div class="i4">“Il Dottore” · Calibre C-1991 · Automatic Chronograph</div>
  <button id="intro-enter" class="btn primary">Enter, please</button><div class="i5">Sound on is recommended · press Enter</div></div>`;
window.addEventListener('error', (e) => console.error('Uncaught:', e.message));
document.addEventListener('DOMContentLoaded', () => App.init());
