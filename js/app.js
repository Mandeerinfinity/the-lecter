/* Orchestration: two-ring bezel selector, main loop, gestures, keyboard, secrets, persistence. */
'use strict';
const RING_NUM = ['', 'I', 'II', 'III'], RINGS = ['Complicazioni', 'Salone', 'Galleria'];
const App = {
  cur: -1, page: 1, flipA: 0, flipT: 0, tiltX: 0, tiltY: 0, tiltTX: 0, tiltTY: 0, lastSec: -1, lastMin: -1, lastHourChimed: -1, built: new Set(), lastT: performance.now(),
  lastInput: performance.now(), stageVisible: true, get lowPower() { return Perf.level === 0; }, frameN: 0, _tf: '', crownClicks: [], keyTrail: [], installPrompt: null, swReady: false, lastOnPage: {},
  visited: new Set(Store.get('visited', [])),
  init() {
    Perf.init(); Haptics.init(); Snd.unlockOnce(); Snd.wireUI(); Parallax.init(); Candle.init(); AutoTheme.init(); Compact.init();
    Watch.init($('#watch')); CaseBack.init($('#caseback')); Fog.init($('#fog')); DialInk.init($('#dialink'));
    Backdrop.init(); if (innerWidth < 900 && Store.get('settings', {}).mothCount == null) Settings.mothCount = 8; Moths.init(); Moths.setCount(this.mothTarget()); NVGrain.init();
    Bus.on('quality', () => { Watch.resize(); CaseBack.resize(); Fog.resize(); Moths.resize(); Moths.setCount(this.mothTarget()); });
    Bus.on('setting', () => { Watch.lastSig = null; });
    if (Settings.theme === 'palace' && !Settings.unlockPalace) Settings.theme = 'florence';
    this.buildPanels(); this.buildDock(); this.bind(); this.layout();
    this.applyAccent(Settings.theme); document.body.classList.toggle('nv', !!Watch.theme.nv); document.body.classList.toggle('reduced', Settings.reducedMotion);
    const start = MODES.findIndex(m => m.id === Settings.mode); this.go(start >= 0 && Settings.mode !== 'back' ? start : 0, true);
    Bus.on('setting', (k, v) => this.onSetting(k, v));
    Bus.on('alarms', () => this.syncAlarm()); this.syncAlarm();
    if (document.fonts && document.fonts.load) Promise.all(['700 20px Cinzel', '20px "Pinyon Script"', '20px "Cormorant Garamond"', '20px "Special Elite"'].map(f => document.fonts.load(f))).then(() => { Watch.build(); CaseBack.layers = {}; Backdrop.draw(); }).catch(() => {});
    requestAnimationFrame((t) => this.loop(t));
    setInterval(() => { if (document.hidden || !this.stageVisible || Night.on) this.second(new Date()); }, 1000);
    if (!/noboot/.test(location.search) && !sessionStorage.getItem('lecter.introShown')) this.intro(); else { const i = $('#intro'); if (i) i.remove(); }
    Ach.unlock('welcome'); this.minuteChecks(new Date());
    if ('serviceWorker' in navigator && location.protocol.startsWith('http') && !/nosw/.test(location.search)) navigator.serviceWorker.register('sw.js').then(() => { this.swReady = true; Bus.emit('install'); }).catch(() => {});
    if ('IntersectionObserver' in window) new IntersectionObserver((en) => { this.stageVisible = en[0].isIntersecting; }, { threshold: 0.02 }).observe($('#stage'));
  },

  /* ——— cinematic introduction ——— */
  intro() {
    let el = $('#intro'); if (!el) { el = document.createElement('div'); el.id = 'intro'; document.body.appendChild(el); }
    el.innerHTML = INTRO_HTML; el.className = ''; requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('play')));
    try { $('.i-watch', el).src = Watch.renderHi(640).toDataURL('image/png'); } catch (e) {}
    let stage = 0, timers = [];
    const finish = () => { if (stage === 2) return; stage = 2; timers.forEach(clearTimeout); removeEventListener('keydown', key, true); el.classList.add('gone'); document.body.classList.add('arrive'); sessionStorage.setItem('lecter.introShown', '1'); setTimeout(() => { el.remove(); document.body.classList.remove('arrive'); }, 1100); };
    const act2 = () => { if (stage) return finish(); stage = 1; Snd.ensure(); Snd.introScore(); el.classList.add('act2'); timers.push(setTimeout(finish, Settings.reducedMotion ? 1200 : 6200)); };
    const key = (e) => { if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); e.key === 'Escape' ? finish() : act2(); } };
    $('#intro-enter', el).onclick = act2; $('.i-skip', el).onclick = finish; addEventListener('keydown', key, true);
    setTimeout(() => { const b = $('#intro-enter', el); if (b && stage === 0) b.focus({ preventScroll: true }); }, 2600);
  },

  /* ——— the two rings ——— */
  pageList(pg) { return MODES.map((m, i) => i).filter(i => (MODES[i].page || 1) === pg); },
  buildBezel(pg) {
    const ring = $('#bezel-ring'), list = this.pageList(pg), n = list.length; ring.innerHTML = ''; ring.dataset.page = pg;
    list.forEach((i, k) => { const m = MODES[i]; const b = el('button', { class: 'bz-item', 'data-i': i, 'aria-label': `${m.name}: ${m.label}`, title: m.name });
      b.innerHTML = `<span class="bz-in">${svgIcon(m.icon)}<em>${m.label}</em></span>`; b.style.setProperty('--a', (k * 360 / n) + 'deg'); b.style.setProperty('--k', k); b.onclick = () => this.go(i); ring.appendChild(b); });
    for (let k = 0; k < n * 4; k++) { const t = el('i', { class: 'bz-tick' + (k % 4 ? '' : ' maj') }); t.style.setProperty('--a', (k * 90 / n) + 'deg'); ring.appendChild(t); }
    $$('.rings button').forEach(b => { const on = +b.dataset.pg === pg; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
  },
  buildDock() {
    const dock = $('#mode-dock'); dock.innerHTML = '';
    const sw = el('button', { class: 'dock-page', 'aria-label': 'Switch ring', title: 'Next ring (V)' }); sw.onclick = () => this.switchPage(); dock.appendChild(sw);
    MODES.forEach((m, i) => { const b = el('button', { 'data-i': i, 'data-pg': m.page || 1, title: m.name, 'aria-label': m.name }); b.innerHTML = svgIcon(m.icon) + `<span>${m.label}</span>`; b.onclick = () => this.go(i); dock.appendChild(b); });
  },
  setPage(pg, animate) {
    if (pg === this.page && $('#bezel-ring').children.length) return; const ring = $('#bezel-ring'); this.page = pg;
    if (animate && !Settings.reducedMotion) { ring.classList.add('swapping'); clearTimeout(this._sw); this._sw = setTimeout(() => ring.classList.remove('swapping'), 700); }
    this.buildBezel(pg); this.ringRot = null; document.body.dataset.ring = pg;
    const db = $('.dock-page'); if (db) db.innerHTML = `<b>${RING_NUM[pg]}</b><span>Ring ${RING_NUM[pg % RINGS.length + 1]} →</span>`;
  },
  switchPage(dir = 1) { this.goPage(((this.page - 1 + dir + RINGS.length) % RINGS.length) + 1); },
  goPage(pg) { if (pg === this.page) return; const last = this.lastOnPage[pg]; this.go(last != null ? last : this.pageList(pg)[0]); toast(`Ring ${RING_NUM[pg]} · ${RINGS[pg - 1]}`); },
  buildPanels() { const body = $('#panel-body'); MODES.forEach(m => { const s = el('section', { class: 'mode-sec', 'data-id': m.id, role: 'region', 'aria-label': m.name }); body.appendChild(s); m.el = s; }); },
  go(i, instant) {
    const N = MODES.length; i = ((i % N) + N) % N; if (i === this.cur) return;
    const prev = MODES[this.cur], dir = this.cur < 0 ? 1 : (i > this.cur ? 1 : -1); if (prev) { prev.el.classList.remove('on'); if (prev.hide) prev.hide(); }
    const m = MODES[i], pg = m.page || 1; m._still = false;
    if (pg !== this.page || !$('#bezel-ring').children.length) this.setPage(pg, !instant);
    if (!this.built.has(m.id)) { m.build(m.el); this.built.add(m.id); }
    const list = this.pageList(pg), k = list.indexOf(i), n = list.length, step = 360 / n;
    let target = -k * step; if (this.ringRot != null) { while (target - this.ringRot > 180) target -= 360; while (target - this.ringRot < -180) target += 360; }
    this.ringRot = target; const ring = $('#bezel-ring'); ring.style.setProperty('--rot', target + 'deg'); ring.classList.toggle('instant', !!instant);
    $$('.bz-item').forEach(b => { const on = +b.dataset.i === i; b.classList.toggle('on', on); b.setAttribute('aria-current', on ? 'true' : 'false'); });
    $$('#mode-dock button[data-i]').forEach(b => { const on = +b.dataset.i === i; b.classList.toggle('on', on); b.hidden = +b.dataset.pg !== pg; b.setAttribute('aria-current', on ? 'true' : 'false'); });
    const db = $(`#mode-dock button[data-i="${i}"]`); if (db && db.scrollIntoView && !instant) db.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    $('#p-kicker').textContent = m.kicker; $('#p-title').textContent = m.name; $('#p-sub').textContent = m.sub;
    $('#mode-name').innerHTML = `<b>${m.name}</b><small>${k + 1} / ${n} · ring ${RING_NUM[pg]}</small>`;
    m.el.classList.add('on'); this.cur = i; this.lastOnPage[pg] = i; if (m.show) m.show(); if (m.tick) m.tick(new Date());
    const P = $('#panel'); P.classList.remove('swap', 'fwd', 'back'); void P.offsetWidth; P.classList.add('swap', dir > 0 ? 'fwd' : 'back');
    const mn = $('#mode-name'); mn.classList.remove('in'); void mn.offsetWidth; mn.classList.add('in');
    if (m.id !== 'back') setSetting('mode', m.id);
    const sr = $('#sr'); if (sr && !instant) sr.textContent = `${m.name}, ${m.label}. ${m.sub}`;
    if (!instant) { Snd.detent(dir); Haptics.tap('detent'); Watch.crownRot += 6; }
    this.visited.add(m.id); Store.set('visited', [...this.visited]); if (MODES.every(x => this.visited.has(x.id))) Bus.emit('ach', 'grand');
  },
  flip(v) { const was = this.flipT; this.flipT = (v == null ? this.flipT < 90 : v) ? 180 : 0; if (was !== this.flipT) { Snd.whoosh(this.flipT ? 1 : -1); Haptics.tap('medium'); } if (Settings.reducedMotion) this.flipA = this.flipT; if (this.flipT === 180) Bus.emit('ach', 'flip'); },
  setTheme(id) {
    if (!THEMES[id]) id = 'florence'; setSetting('theme', id); Watch.setTheme(id); CaseBack.layers = {}; Backdrop.draw(); document.body.classList.toggle('nv', !!Watch.theme.nv);
    this.applyAccent(id); toast(THEMES[id].name);
  },
  applyAccent(id) { document.documentElement.style.setProperty('--accent', { nv: '#6fdc6a', ivory: '#8a1e1e', crimson: '#c89b62', moth: '#d9a441', palace: '#d9b04a' }[id] || '#b3202a'); },
  cycleTheme(d = 1) { const O = themeOrder(), i = O.indexOf(Settings.theme); this.setTheme(O[(i + d + O.length) % O.length]); },
  onSetting(k, v) {
    if (k === 'moths' || k === 'mothCount') Moths.setCount(this.mothTarget());
    if (k === 'reducedMotion') { document.body.classList.toggle('reduced', v); Moths.setCount(Settings.moths && !v ? Settings.mothCount : 0); }
    if (k === 'fog' && !v) Fog.clear();
    if (k === 'h24') { const m = MODES[this.cur]; if (m.tick) { m._s = -1; m.tick(new Date(), true); } }
  },
  syncAlarm() { const n = Alarms.next(); Watch.state.alarm = n ? { h: n.at.getHours(), m: n.at.getMinutes() } : null; },
  fullscreen() { const d = document; if (!d.fullscreenElement) { (d.documentElement.requestFullscreen || d.documentElement.webkitRequestFullscreen || (() => toast('Fullscreen is not available'))).call(d.documentElement); } else (d.exitFullscreen || d.webkitExitFullscreen).call(d); },
  help() { const h = $('#help'); h.classList.toggle('show'); if (h.classList.contains('show')) { this._focus = document.activeElement; setTimeout(() => $('.close', h).focus(), 50); } else if (this._focus && this._focus.focus) this._focus.focus(); },
  layout() {
    const st = $('#stage'), mobile = innerWidth < 900, w = st.clientWidth, h = mobile ? innerHeight * 0.7 : st.clientHeight;
    const cp = document.body.classList.contains('compact'), S = cp ? Math.floor(Math.min(innerWidth / 1.3, (innerHeight - 90) / 1.22, 860)) : Math.floor(Math.min(w / (mobile ? 1.24 : 1.3), (h - (mobile ? 96 : 150)) / 1.22, 720));
    document.documentElement.style.setProperty('--S', S + 'px');
    MODES.forEach(x => { x._still = false; }); requestAnimationFrame(() => { Watch.resize(); CaseBack.resize(); Fog.resize(); DialInk.resize(); Moths.resize(); Backdrop.draw(); if (Night.on) Night.resize(); });
  },
  local(e) { const r = $('#watch').getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * Watch.W, y: (e.clientY - r.top) / r.height * Watch.W }; },
  bind() {
    addEventListener('resize', () => { clearTimeout(this._rz); this._rz = setTimeout(() => this.layout(), 120); });
    const poke = () => { this.lastInput = performance.now(); };
    ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(ev => addEventListener(ev, poke, { passive: true, capture: true }));
    addEventListener('pointermove', (e) => {
      if (e.pointerType === 'mouse' && (Math.abs(e.movementX) + Math.abs(e.movementY) > 2)) poke();
      const r = this._swr && performance.now() - this._swrT < 500 ? this._swr : (this._swr = $('#stage-watch').getBoundingClientRect(), this._swrT = performance.now(), this._swr);
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2, dx = e.clientX - cx, dy = e.clientY - cy;
      if (Settings.lightFollow && e.pointerType !== 'touch') Watch.lightTarget = Math.atan2(dx, -dy);
      if (!Settings.reducedMotion && e.pointerType !== 'touch') { this.tiltTY = clamp(dx / innerWidth * 14, -7, 7); this.tiltTX = clamp(-dy / innerHeight * 10, -5, 5); }
    }, { passive: true });
    // catch a hovering moth
    addEventListener('pointerdown', (e) => { const h = Moths.hover; if (h && Math.hypot(h.x - e.clientX, h.y - e.clientY) < 28) { if (Ach.unlock('moth')) toast('Caught, admired, released.'); } }, { capture: true, passive: true });
    const sw = $('#stage-watch'); let drag = null, press = null;
    sw.addEventListener('pointerdown', (e) => {
      Snd.ensure(); const p = this.local(e), g = Watch.geom(), dx = p.x - g.cx, dy = p.y - g.cy, R = g.R, dist = Math.hypot(dx, dy);
      if (this.flipT === 180) { drag = { x: e.clientX, y: e.clientY, a: Math.atan2(dy, dx) }; sw.setPointerCapture(e.pointerId); return; }
      if (DialInk.on && dist < R * 0.83) { sw.setPointerCapture(e.pointerId); DialInk.brush.down(p.x, p.y, 0.6); drag = { ink: true }; e.preventDefault(); return; }
      const hit = (ang, rr, rad) => Math.hypot(dx - Math.cos(ang) * rr, dy - Math.sin(ang) * rr) < rad;
      if (hit(-Math.PI / 6, R * 1.02, R * 0.1)) { const cm = MODES.findIndex(m => m.id === 'chrono'); if (this.cur !== cm) this.go(cm); Snd.pusher(0); Haptics.tap('press'); Chrono.toggle(); return; }
      if (hit(Math.PI / 6, R * 1.02, R * 0.1)) { const cm = MODES.findIndex(m => m.id === 'chrono'); if (this.cur !== cm) this.go(cm); Snd.pusher(1); Haptics.tap('press'); Chrono.lapOrReset(); return; }
      if (hit(Math.PI * 0.92, R * 1.02, R * 0.11)) { Snd.pusher(0); Haptics.tap('press'); Repeater.strike(); toast('The repeater strikes the time'); return; }
      if (hit(0, R * 1.08, R * 0.12)) { this.crown(); return; }
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
      const dx = p.x - g.cx, dy = p.y - g.cy, R = g.R, near = (ang, rr, rad) => Math.hypot(dx - Math.cos(ang) * rr, dy - Math.sin(ang) * rr) < rad;
      sw.style.cursor = (near(-Math.PI / 6, R * 1.02, R * 0.1) || near(Math.PI / 6, R * 1.02, R * 0.1) || near(Math.PI * 0.92, R * 1.02, R * 0.11) || near(0, R * 1.08, R * 0.12)) ? 'pointer' : '';
    });
    const end = (e) => {
      clearTimeout(this._lp);
      if (drag && drag.ink) DialInk.brush.up(); drag = null;
      if (press && e.type === 'pointerup') { const dx = e.clientX - press.x, dy = e.clientY - press.y, dt = performance.now() - press.t;
        if (press.type !== 'mouse' && !(press.fog && press.inCrystal) && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4 && dt < 700) this.go(this.cur + (dx < 0 ? 1 : -1)); }
      press = null;
    };
    sw.addEventListener('pointerup', end); sw.addEventListener('pointercancel', end);
    sw.addEventListener('dblclick', () => { if (!DialInk.on) this.flip(); });
    const stage = $('#stage'); let ts = null;
    stage.addEventListener('touchstart', (e) => { if (e.target.closest('#stage-watch')) return; const t = e.touches[0]; ts = { x: t.clientX, y: t.clientY, t: performance.now() }; }, { passive: true });
    stage.addEventListener('touchend', (e) => { if (!ts) return; const t = e.changedTouches[0], dx = t.clientX - ts.x, dy = t.clientY - ts.y; if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4 && performance.now() - ts.t < 700) this.go(this.cur + (dx < 0 ? 1 : -1)); ts = null; }, { passive: true });
    let acc = 0; $('#stage').addEventListener('wheel', (e) => { e.preventDefault(); acc += e.deltaY; Watch.crownRot += e.deltaY * 0.05; if (Math.abs(acc) > 70) { this.go(this.cur + Math.sign(acc)); acc = 0; } }, { passive: false });
    $$('[data-act]').forEach(b => { b._bound = true; b.addEventListener('click', () => this.act(b.dataset.act)); });
    document.addEventListener('click', (e) => { const b = e.target.closest('[data-act]'); if (b && !b._bound && b.closest('#panel-body')) { this.act(b.dataset.act); } });
    $$('.rings button').forEach(b => b.onclick = () => this.goPage(+b.dataset.pg));
    $('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal' && !Alarms.ringing) Modal.close(); });
    $('#help').addEventListener('click', (e) => { if (e.target.id === 'help' || e.target.closest('.close')) this.help(); });
    $('#m-prev').onclick = () => this.go(this.cur - 1); $('#m-next').onclick = () => this.go(this.cur + 1);
    addEventListener('keydown', (e) => this.key(e));
    addEventListener('deviceorientation', (e) => {
      if (e.gamma == null) return; const gx = clamp(e.gamma / 45, -1, 1), gy = clamp((e.beta - 35) / 45, -1, 1);
      if (Settings.lightFollow) Watch.lightTarget = Math.atan2(-gx, gy) + Math.PI; this.tiltTY = gx * 6; this.tiltTX = -gy * 4;
      CaseBack.grav = Math.hypot(gx, gy) > 0.15 ? Math.atan2(-gx, gy) : null;
    });
    document.addEventListener('visibilitychange', () => { this.lastT = performance.now(); document.body.classList.toggle('hidden-tab', document.hidden); if (!document.hidden) { this.ema = 0.016; this.slowFor = 0; if (Snd.resume) Snd.resume(); } });
    document.addEventListener('fullscreenchange', () => setTimeout(() => this.layout(), 150));
    addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); this.installPrompt = e; Bus.emit('install'); });
    addEventListener('appinstalled', () => { this.installPrompt = null; toast('Installed. Welcome home.'); Bus.emit('install'); });
  },
  crown() {
    Snd.ratchet(0.6); this.go(this.cur + 1); CaseBack.wind(0.03); const t = performance.now(); this.crownClicks = this.crownClicks.filter(x => t - x < 2500); this.crownClicks.push(t);
    if (this.crownClicks.length >= 5) { this.crownClicks = []; const first = !Settings.unlockPalace; setSetting('unlockPalace', true); this.setTheme('palace'); Ach.unlock('palace'); toast(first ? 'A hidden dial: the Memory Palace' : 'The Memory Palace'); const th = MODES.find(m => m.id === 'themes'); if (th && th.renderCards) th.renderCards(); }
  },
  act(a) {
    Snd.ensure();
    if (a === 'flip') this.flip(); else if (a === 'breathe') Fog.breathe(); else if (a === 'moths') { setSetting('moths', !Settings.moths); toast(Settings.moths ? 'The moths return' : 'The moths depart'); }
    else if (a === 'theme') this.cycleTheme(1); else if (a === 'fullscreen') this.fullscreen(); else if (a === 'help') this.help();
    else if (a === 'repeater') Repeater.strike(); else if (a === 'speak') Voice.sayTime(true); else if (a === 'night') Night.start(true); else if (a === 'ring') this.switchPage();
    else if (a === 'secrets') this.go(MODES.findIndex(m => m.id === 'secrets'));
  },
  konami(e) {
    const K = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    this.keyTrail.push(e.key.length === 1 ? e.key.toLowerCase() : e.key); if (this.keyTrail.length > K.length) this.keyTrail.shift();
    if (this.keyTrail.join() === K.join()) { this.keyTrail = []; Moths.storm(9); Ach.unlock('konami'); toast('The moths have heard you', 3200); return true; }
    const tr = this.keyTrail.slice(-9); if (tr.length === 9 && tr.join() === K.slice(0, 9).join()) return true; // the 'b' of the code should not breathe on the glass
  },
  key(e) {
    if (e.target.closest && e.target.closest('input, textarea, select')) { if (e.key === 'Escape') e.target.blur(); return; }
    if ($('#intro') && !$('#intro').classList.contains('gone')) return;
    if (Night.on) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (this.konami(e)) { e.preventDefault(); return; }
    const m = MODES[this.cur]; Snd.ensure();
    if (e.key === 'Escape' && Compact.on() && !$('#help').classList.contains('show') && !$('#modal').classList.contains('show')) { Compact.set(false); return; }
    if (e.key === 'Escape') { if ($('#help').classList.contains('show')) this.help(); else if ($('#modal').classList.contains('show') && !Alarms.ringing) Modal.close(); else if (DialInk.on) { DialInk.setOn(false); const c = $('#sk-dial'); if (c) c.checked = false; } else if (this.flipT) this.flip(false); return; }
    if (e.target.closest && e.target.closest('button, a, [role=radio]') && (e.key === 'Enter' || e.code === 'Space')) return; // let focused controls work
    if (m.key && m.key(e)) { e.preventDefault(); return; }
    const k = e.key;
    if (k === 'ArrowRight' || k === ']') { this.go(this.cur + 1); e.preventDefault(); }
    else if (k === 'ArrowLeft' || k === '[') { this.go(this.cur - 1); e.preventDefault(); }
    else if (/^[0-9]$/.test(k)) { const L = this.pageList(this.page), idx = k === '0' ? 9 : +k - 1; if (L[idx] != null) this.go(L[idx]); }
    else if (k === 't') this.cycleTheme(1); else if (k === 'T') this.cycleTheme(-1);
    else if (k === 'h' || k === 'H') { setSetting('h24', !Settings.h24); toast(Settings.h24 ? '24-hour time' : '12-hour time'); }
    else if (k === 'f' || k === 'F') this.fullscreen();
    else if (k === 'b' || k === 'B') Fog.breathe();
    else if (k === 'm' || k === 'M') this.act('moths');
    else if (k === 'k' || k === 'K') this.flip();
    else if (k === 'v' || k === 'V') this.switchPage(e.shiftKey ? -1 : 1);
    else if (k === 'c' || k === 'C') { if (Repeater.strike()) toast('The repeater strikes the time'); }
    else if (k === 's' || k === 'S') Voice.sayTime(true);
    else if (k === 'z' || k === 'Z') Night.start(true);
    else if (k === 'p' || k === 'P') { const mu = MODES.find(x => x.id === 'music'); if (!this.built.has('music')) { mu.build(mu.el); this.built.add('music'); } mu.toggle(); toast(Player.playing ? 'Harpsichord: ' + Player.piece.name : 'Music paused'); }
    else if (k === '?' || k === '/') this.help();
    else if (e.code === 'Space') { e.preventDefault(); Chrono.toggle(); toast(Chrono.s.running ? 'Chronograph running' : 'Chronograph stopped'); }
  },
  minuteChecks(now) {
    const h = now.getHours(); if (h === 0) Bus.emit('ach', 'night'); if (moonPhase(now).illum > 0.97) Bus.emit('ach', 'fullmoon');
    const c = $('#watch'); if (c) c.setAttribute('aria-label', `The watch dial. It shows ${fmtClock(now)}, ${now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}. The moon is ${moonPhase(now).name.toLowerCase()}.`);
  },
  /* Once a second, even when the tab is hidden (via the interval fallback). */
  second(now) {
    const s = now.getSeconds(); if (s === this.lastSec) return; this.lastSec = s;
    Countdown.check(); Alarms.check(now); Sessions.check(); if (s % 20 === 0) this.syncAlarm();
    if (Settings.tick && Snd.ctx && !document.hidden) Snd.tick(0.1);
    if (Settings.hourlyChime && now.getMinutes() === 0 && this.lastHourChimed !== now.getHours()) { this.lastHourChimed = now.getHours(); Snd.chime(now.getHours() % 12 || 12); }
    if (now.getMinutes() !== this.lastMin) { this.lastMin = now.getMinutes(); this.minuteChecks(now); }
    const modalUp = $('#modal').classList.contains('show');
    if (Night.on && (modalUp || Alarms.ringing)) Night.stop();
    if (+Settings.idleMins > 0 && !Night.on && !modalUp && !document.hidden && !($('#intro') && !$('#intro').classList.contains('gone')) && performance.now() - this.lastInput > Settings.idleMins * 60000) Night.start(false);
  },
  mothTarget() { return Settings.moths && !Settings.reducedMotion ? Math.min(Settings.mothCount, Perf.mothCap()) : 0; },
  /* The frame loop is time-based (dt from the rAF timestamp), so every animation runs at the same speed at 60 or 120 Hz.
     Canvases only repaint when something visible changed; the governor watches the cost and adjusts quality. */
  loop(t) {
    requestAnimationFrame((tt) => this.loop(tt));
    const t0 = performance.now(), raw = Math.max(0, t - this.lastT), dt = Math.min(0.1, raw / 1000); this.lastT = t; const now = new Date(); this.frameN++;
    Watch.state.chrono.elapsed = Chrono.elapsed(); Watch.state.chrono.running = Chrono.s.running;
    Watch.state.timer = Countdown.active() ? { active: true, frac: Countdown.frac() } : null;
    Watch.state.session = Sessions.s.phase !== 'idle' ? { active: true, frac: Sessions.frac(), rest: Sessions.s.phase !== 'focus' } : null;
    const glowT = (Night.on ? 1.6 : 1) * (Watch.theme.nv ? 1 : 0.9); Watch.glow += (glowT - Watch.glow) * (1 - Math.exp(-dt * 3)); if (Math.abs(glowT - Watch.glow) < 0.004) Watch.glow = glowT;
    if (!Night.on && !document.hidden) {
      const kf = 1 - Math.exp(-dt * 5.5); this.flipA += (this.flipT - this.flipA) * kf; if (Math.abs(this.flipT - this.flipA) < 0.05) this.flipA = this.flipT;
      const kt = 1 - Math.exp(-dt * 4); this.tiltX += (this.tiltTX - this.tiltX) * kt; this.tiltY += (this.tiltTY - this.tiltY) * kt;
      if (Math.abs(this.tiltTX - this.tiltX) < 0.01) this.tiltX = this.tiltTX; if (Math.abs(this.tiltTY - this.tiltY) < 0.01) this.tiltY = this.tiltTY;
      const pop = Math.sin(this.flipA / 180 * Math.PI) * 0.06;
      if (this.stageVisible) {
        const tf = `scale(${(1 - pop).toFixed(4)}) rotateX(${this.tiltX.toFixed(2)}deg) rotateY(${(this.flipA + this.tiltY).toFixed(2)}deg)`;
        if (tf !== this._tf) { this._tf = tf; this.$w3 = this.$w3 || $('#watch3d'); this.$w3.style.transform = tf; if (typeof Parallax !== 'undefined') Parallax.set(this.tiltX, this.tiltY); }
        const frontVisible = this.flipA < 95, backVisible = this.flipA > 85;
        if (frontVisible) { Watch.render(now, dt); Fog.render(dt); Candle.aim(Watch.light); }
        if (backVisible && !(Perf.q.half && Perf.hz >= 90 && (this.frameN & 1))) CaseBack.render(now);
      }
      if (!Settings.reducedMotion) Moths.update(dt, t / 1000);
      if (typeof Candle !== 'undefined') Candle.frame(t, dt);
      const m = MODES[this.cur]; if (m.tick && (!this._tk || t - this._tk > 125)) { this._tk = t; m.tick(now); } if (m.frame) m.frame(dt);
    }
    this.second(now);
    Perf.frame(raw, performance.now() - t0);
  },
  goLow() { if (Perf.level > 0) Perf.step(-1); }
};
const INTRO_HTML = `<div class="intro-inner"><div class="i-stars" aria-hidden="true">✦ ✦ ✦ ✦ ✦</div>
  <div class="i1" aria-label="Cinco Corporation">${[...'CINCO CORPORATION'].map((c, i) => `<span style="--d:${i}">${c === ' ' ? '&nbsp;' : c}</span>`).join('')}</div><div class="i2">presents</div>
  <div class="i-stage" aria-hidden="true"><div class="i-halo"></div><img class="i-watch" alt=""><div class="i-glint"></div></div>
  <div class="i3">The Lecter</div><div class="i4">“Il Dottore” · Calibre C-1991 · Automatic Chronograph</div>
  <button id="intro-enter" class="btn primary">Enter, please</button><div class="i5">Sound on is recommended · press Enter</div></div><button class="i-skip">Skip ›</button>`;
window.addEventListener('error', (e) => console.error('Uncaught:', e.message));
document.addEventListener('DOMContentLoaded', () => App.init());
