/* Complications I — time, chronograph, countdown, alarm, world time, moon, case back. */
'use strict';
const MODES = [];
const ICON = {
  time: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.5 2"/>',
  chrono: '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 13.5V9M10 3h4M12 3v3M18.5 6.5l1.5-1.5"/>',
  timer: '<path d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9s8 4 8 9"/>',
  alarm: '<path d="M6 17V11a6 6 0 0 1 12 0v6l1.5 2h-15z"/><path d="M10 21h4M4 6l3-3M20 6l-3-3"/>',
  world: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c3 3 3 14 0 17M12 3.5c-3 3-3 14 0 17"/>',
  moon: '<path d="M19 14.5A8 8 0 1 1 9.5 5a6.5 6.5 0 0 0 9.5 9.5z"/>',
  back: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
  menu: '<path d="M8 3v7a4 4 0 0 0 8 0V3M12 14v7M8.5 21h7"/>',
  quid: '<path d="M4 20l4-1L19.5 7.5a2.1 2.1 0 0 0-3-3L5 16z"/><path d="M14.5 6.5l3 3"/>',
  sketch: '<path d="M4 20c4-1 6-5 9-8s5-5 7-8M3 21l2-.5"/><path d="M14 10l2 2"/>',
  interro: '<path d="M2.5 12h4l2-5 3 10 2.5-7 1.5 2h6"/>',
  music: '<path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
  themes: '<path d="M12 3l8 6-8 12-8-12z"/><path d="M4 9h16M9 9l3 12 3-12M8 3.8L9 9M16 3.8L15 9"/>',
  dossier: '<path d="M3 6h6l2 2h10v11H3z"/><path d="M7 12h8M7 15h5"/>',
  settings: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>'
};
const svgIcon = (k) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${ICON[k]}</svg>`;
const Modal = {
  open(html, cls = '') { const m = $('#modal'); $('#modal-card').className = 'modal-card ' + cls; $('#modal-card').innerHTML = html; m.classList.add('show'); return $('#modal-card'); },
  close() { $('#modal').classList.remove('show'); }
};
function pressPusher(which) { Watch.push[which] = 1; Snd.click(); }

/* ——— I. L'Ora ——— */
MODES.push({
  id: 'time', name: "L'Ora", label: 'Time', kicker: 'Complication I', icon: 'time', sub: 'Hours, minutes and the quiet company of the seconds.',
  build(el) {
    el.innerHTML = `
      <div class="big-time"><span id="t-main">--:--</span><span id="t-sec">00</span><span id="t-ap"></span></div>
      <div class="date-line" id="t-date"></div>
      <div class="rule"></div>
      <div class="grid2">
        <div class="stat"><label>Lune</label><b id="t-moon">—</b><small id="t-moon2"></small></div>
        <div class="stat"><label>Firenze</label><b id="t-flo">—</b><small id="t-flo2"></small></div>
        <div class="stat"><label>Next alarm</label><b id="t-al">None set</b><small id="t-al2"></small></div>
        <div class="stat"><label>Countdown</label><b id="t-cd">Idle</b><small>Time until Clarice returns</small></div>
      </div>
      <div class="btn-row">
        <button class="btn" id="t-h24">12 / 24 h</button>
        <button class="btn" data-act="breathe">Breathe on the glass</button>
        <button class="btn" data-act="flip">Turn it over</button>
      </div>
      <p class="fine">Reading the dial: <em>9 o'clock</em>, running seconds · <em>3 o'clock</em>, chronograph minutes · <em>6 o'clock</em>, moon phase with pointer date.
      The seconds hand beats eight times a second, as a 28,800 vibration movement should. Maker: <span class="sc">Cinco Corporation</span>.</p>`;
    $('#t-h24', el).onclick = () => { setSetting('h24', !Settings.h24); toast(Settings.h24 ? '24-hour time' : '12-hour time'); };
  },
  tick(now) {
    let h = now.getHours(); const m = now.getMinutes();
    $('#t-main').textContent = Settings.h24 ? pad(h) + ':' + pad(m) : ((h % 12) || 12) + ':' + pad(m);
    $('#t-sec').textContent = pad(now.getSeconds()); $('#t-ap').textContent = Settings.h24 ? '' : (h >= 12 ? 'PM' : 'AM');
    if (now.getSeconds() !== this._s) {
      this._s = now.getSeconds();
      $('#t-date').textContent = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) + ' · day ' + (Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 864e5));
      const mp = moonPhase(now); $('#t-moon').textContent = mp.name; $('#t-moon2').textContent = Math.round(mp.illum * 100) + '% illuminated';
      const f = zoneTime('Europe/Rome', now); $('#t-flo').textContent = Settings.h24 ? pad(f.h) + ':' + pad(f.m) : ((f.h % 12) || 12) + ':' + pad(f.m) + (f.h >= 12 ? ' PM' : ' AM'); $('#t-flo2').textContent = f.dateStr;
      const na = Alarms.next(now); $('#t-al').textContent = na ? fmtClock(na.at) : 'None set'; $('#t-al2').textContent = na ? (na.a.label || 'Alarm') : '';
      $('#t-cd').textContent = Countdown.active() ? fmtDur(Countdown.remaining(), false) : 'Idle';
    }
  }
});

/* ——— II. Chronograph ——— */
const Chrono = {
  s: Store.get('chrono', { running: false, start: 0, acc: 0, laps: [] }),
  elapsed() { return this.s.acc + (this.s.running ? Date.now() - this.s.start : 0); },
  save() { Store.set('chrono', this.s); },
  toggle() { pressPusher('top'); if (this.s.running) { this.s.acc = this.elapsed(); this.s.running = false; } else { this.s.start = Date.now(); this.s.running = true; } this.save(); this.render(); },
  lapOrReset() { pressPusher('bot'); if (this.s.running) { const e = this.elapsed(); const prev = this.s.laps.length ? this.s.laps[0].t : 0; this.s.laps.unshift({ t: e, d: e - prev }); } else { this.s = { running: false, start: 0, acc: 0, laps: [] }; } this.save(); this.render(); },
  render() {
    const box = $('#c-laps'); if (!box) return; const L = this.s.laps;
    $('#c-start').textContent = this.s.running ? 'Stop' : (this.elapsed() ? 'Resume' : 'Start');
    $('#c-lap').textContent = this.s.running ? 'Lap' : 'Reset';
    if (!L.length) { box.innerHTML = '<li class="empty">No laps recorded. Patience is its own measure.</li>'; return; }
    const ds = L.map(l => l.d), best = Math.min(...ds), worst = Math.max(...ds);
    box.innerHTML = L.map((l, i) => `<li class="${L.length > 2 && l.d === best ? 'best' : ''} ${L.length > 2 && l.d === worst ? 'worst' : ''}"><span>Lap ${L.length - i}</span><span>${fmtDur(l.d)}</span><span>${fmtDur(l.t)}</span></li>`).join('');
  }
};
MODES.push({
  id: 'chrono', name: 'Cronografo', label: 'Chrono', kicker: 'Complication II', icon: 'chrono', sub: 'Column-wheel chronograph. The upper pusher starts and stops it, the lower one records laps.',
  build(el) {
    el.innerHTML = `<div class="big-time mono" id="c-read">00:00.00</div><div class="date-line" id="c-hr">Hours 0 · minutes on the 3 o'clock register</div>
      <div class="btn-row"><button class="btn primary" id="c-start">Start</button><button class="btn" id="c-lap">Reset</button></div>
      <ol class="laps" id="c-laps"></ol><p class="fine">Keys: <kbd>Space</kbd> start/stop · <kbd>L</kbd> lap · <kbd>R</kbd> reset. You can also press the pushers on the case. Laps are kept if you reload the page.</p>`;
    $('#c-start', el).onclick = () => Chrono.toggle(); $('#c-lap', el).onclick = () => Chrono.lapOrReset(); Chrono.render();
  },
  tick() { const e = Chrono.elapsed(); $('#c-read').textContent = fmtDur(e); $('#c-hr').textContent = `Hours ${Math.floor(e / 3600000)} · minute register ${Math.floor(e / 60000) % 30} / 30`; },
  key(e) { if (e.code === 'Space') { Chrono.toggle(); return true; } if (e.key === 'l' || e.key === 'L') { if (Chrono.s.running) Chrono.lapOrReset(); return true; } if (e.key === 'r' || e.key === 'R') { if (!Chrono.s.running) Chrono.lapOrReset(); return true; } }
});

/* ——— III. Countdown ——— */
const Countdown = {
  s: Store.get('countdown', { running: false, end: 0, dur: 0, left: 0 }),
  save() { Store.set('countdown', this.s); },
  active() { return this.s.running || this.s.left > 0; },
  remaining() { return this.s.running ? Math.max(0, this.s.end - Date.now()) : this.s.left; },
  frac() { return this.s.dur ? this.remaining() / this.s.dur : 0; },
  start(ms) { Snd.ensure(); this.s = { running: true, end: Date.now() + ms, dur: ms, left: 0 }; this.save(); this.ui(); },
  pause() { if (this.s.running) { this.s.left = this.remaining(); this.s.running = false; } else if (this.s.left > 0) { this.s.end = Date.now() + this.s.left; this.s.running = true; this.s.left = 0; } this.save(); this.ui(); },
  reset() { this.s = { running: false, end: 0, dur: 0, left: 0 }; this.save(); this.ui(); },
  check() {
    if (this.s.running && Date.now() >= this.s.end) {
      this.reset(); Snd.chime(3);
      Modal.open(`<div class="kicker">Countdown complete</div><h2>Clarice has returned.</h2><p>She is punctual, which is a courtesy. Do sit up straight.</p><div class="btn-row center"><button class="btn primary" onclick="Modal.close()">Receive her</button></div>`, 'notice');
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    }
  },
  ui() {
    const b = $('#cd-go'); if (!b) return;
    $('#cd-pause').textContent = this.s.running ? 'Pause' : 'Resume'; $('#cd-pause').disabled = !this.active(); $('#cd-reset').disabled = !this.active();
  }
};
MODES.push({
  id: 'timer', name: 'Countdown', label: 'Clarice', kicker: 'Complication III', icon: 'timer', sub: 'Time until Clarice returns. The remaining time shows as a crimson arc on the dial.',
  build(el) {
    el.innerHTML = `<div class="cd-ring"><svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="88" class="trk"/><circle cx="100" cy="100" r="88" class="val" id="cd-arc"/></svg><div class="cd-read"><small>Time until Clarice returns</small><b id="cd-read" class="mono">00:00</b><em id="cd-at"></em></div></div>
      <div class="presets">${[['1 min', 60], ['5 min', 300], ['15 min', 900], ['30 min', 1800], ['1 hour', 3600], ['3 hours', 10800]].map(([l, s]) => `<button class="chip" data-s="${s}">${l}</button>`).join('')}</div>
      <form class="hms" id="cd-form"><input type="number" min="0" max="99" id="cd-h" placeholder="h" aria-label="hours"><span>:</span><input type="number" min="0" max="59" id="cd-m" placeholder="m" aria-label="minutes"><span>:</span><input type="number" min="0" max="59" id="cd-s" placeholder="s" aria-label="seconds"><button class="btn primary" id="cd-go" type="submit">Begin</button></form>
      <form class="hms" id="cd-until"><label class="lbl">…or until</label><input type="datetime-local" id="cd-dt"><button class="btn" type="submit">Set</button></form>
      <div class="btn-row"><button class="btn" id="cd-pause">Pause</button><button class="btn" id="cd-reset">Reset</button><button class="btn ghost" id="cd-test">Hear the chime</button></div>`;
    $$('.chip', el).forEach(c => c.onclick = () => Countdown.start(+c.dataset.s * 1000));
    $('#cd-form', el).onsubmit = (e) => { e.preventDefault(); const ms = ((+$('#cd-h').value || 0) * 3600 + (+$('#cd-m').value || 0) * 60 + (+$('#cd-s').value || 0)) * 1000; if (ms > 0) Countdown.start(ms); else toast('Enter a duration first'); };
    $('#cd-until', el).onsubmit = (e) => { e.preventDefault(); const t = new Date($('#cd-dt').value).getTime(); if (t > Date.now()) Countdown.start(t - Date.now()); else toast('Choose a moment in the future'); };
    $('#cd-pause', el).onclick = () => Countdown.pause(); $('#cd-reset', el).onclick = () => Countdown.reset(); $('#cd-test', el).onclick = () => Snd.chime(1);
    Countdown.ui();
  },
  tick() {
    const rem = Countdown.remaining(), f = Countdown.frac(); $('#cd-read').textContent = fmtDur(Math.ceil(rem / 1000) * 1000, false);
    $('#cd-arc').style.strokeDashoffset = String(553 * (1 - f));
    $('#cd-at').textContent = Countdown.s.running ? 'Expected at ' + fmtClock(new Date(Countdown.s.end)) : Countdown.s.left ? 'Paused' : 'Not expected yet';
  }
});

/* ——— IV. Alarm ——— */
const Alarms = {
  list: Store.get('alarms', []), ringing: null, snoozeUntil: null, lastKey: '',
  save() { Store.set('alarms', this.list); Bus.emit('alarms'); },
  next(now = new Date()) {
    let best = null;
    for (const a of this.list) { if (!a.on) continue; const [h, m] = a.time.split(':').map(Number);
      for (let d = 0; d < 8; d++) { const t = new Date(now); t.setDate(t.getDate() + d); t.setHours(h, m, 0, 0); if (t <= now) continue; if (a.days.length && !a.days.includes(t.getDay())) continue; if (!best || t < best.at) best = { a, at: t }; break; } }
    if (this.snoozeUntil && (!best || this.snoozeUntil < best.at)) best = { a: { label: 'Snoozed' }, at: this.snoozeUntil };
    return best;
  },
  check(now) {
    if (this.ringing) return; const key = now.getHours() + ':' + now.getMinutes();
    if (this.snoozeUntil && now >= this.snoozeUntil) { this.snoozeUntil = null; this.ring({ label: 'Snoozed alarm' }); return; }
    if (key === this.lastKey) return;
    for (const a of this.list) { if (!a.on) continue; const [h, m] = a.time.split(':').map(Number);
      if (h === now.getHours() && m === now.getMinutes() && (!a.days.length || a.days.includes(now.getDay()))) { this.lastKey = key; if (!a.days.length) { a.on = false; this.save(); this.render(); } this.ring(a); break; } }
  },
  ring(a) {
    this.ringing = a; Snd.ensure(); const prevBus = Player.bus, wasId = Player.playing ? Player.id : null;
    Player.loop = true; Player.play('toccata', 7); Bus.emit('music', 'alarm');
    const card = Modal.open(`<div class="kicker">Alarm · ${fmtClock(new Date())}</div><h2>${(a.label || 'Good morning').replace(/</g, '&lt;')}</h2><p>A toccata, played on a harpsichord that exists only in arithmetic. Rise when you are ready, but do rise.</p>
      <div class="btn-row center"><button class="btn primary" id="al-dismiss">Dismiss</button><button class="btn" id="al-snooze">Snooze 9 min</button></div>`, 'notice ringing');
    const stop = () => { Player.stop(); this.ringing = null; Modal.close(); };
    $('#al-dismiss', card).onclick = stop; $('#al-snooze', card).onclick = () => { stop(); this.snoozeUntil = new Date(Date.now() + 9 * 60000); toast('Snoozed until ' + fmtClock(this.snoozeUntil)); };
    if (navigator.vibrate) navigator.vibrate([300, 150, 300, 150, 300]);
  },
  render() {
    const ul = $('#al-list'); if (!ul) return;
    if (!this.list.length) { ul.innerHTML = '<li class="empty">No alarms. You wake when you choose, apparently.</li>'; return; }
    const D = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    ul.innerHTML = this.list.map((a, i) => `<li class="${a.on ? '' : 'off'}"><div><b>${fmtClock(new Date(2000, 0, 1, ...a.time.split(':').map(Number)))}</b><small>${(a.label || 'Alarm').replace(/</g, '&lt;')} · ${a.days.length ? a.days.map(d => D[d]).join(' ') : 'once'}</small></div>
      <label class="switch"><input type="checkbox" data-i="${i}" ${a.on ? 'checked' : ''}><span></span></label><button class="x" data-del="${i}" aria-label="delete">×</button></li>`).join('');
    $$('input[data-i]', ul).forEach(c => c.onchange = () => { this.list[+c.dataset.i].on = c.checked; this.save(); this.render(); });
    $$('[data-del]', ul).forEach(b => b.onclick = () => { this.list.splice(+b.dataset.del, 1); this.save(); this.render(); });
  }
};
MODES.push({
  id: 'alarm', name: 'Sveglia', label: 'Alarm', kicker: 'Complication IV', icon: 'alarm', sub: 'Alarms that play a synthesized harpsichord toccata. A crimson marker on the rehaut shows the next one.',
  build(el) {
    el.innerHTML = `<form id="al-form" class="al-form"><input type="time" id="al-time" required value="07:00"><input type="text" id="al-label" maxlength="40" placeholder="Label (e.g. Morning rounds)">
      <div class="days">${['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d, i) => `<button type="button" class="day-btn" data-d="${i}">${d}</button>`).join('')}</div>
      <button class="btn primary" type="submit">Add alarm</button></form><ul class="al-list" id="al-list"></ul>
      <div class="btn-row"><button class="btn ghost" id="al-test">Test the harpsichord alarm</button></div><p class="fine">Leave the days blank for a one-time alarm. Alarms only ring while this page is open.</p>`;
    $$('.day-btn', el).forEach(b => b.onclick = () => b.classList.toggle('on'));
    $('#al-form', el).onsubmit = (e) => { e.preventDefault(); const days = $$('.day-btn.on', el).map(b => +b.dataset.d);
      Alarms.list.push({ time: $('#al-time').value, label: $('#al-label').value.trim(), days, on: true }); Alarms.save(); Alarms.render(); $('#al-label').value = ''; $$('.day-btn', el).forEach(b => b.classList.remove('on')); toast('Alarm set for ' + $('#al-time').value); Snd.ensure(); };
    $('#al-test', el).onclick = () => Alarms.ring({ label: 'A test, nothing more' });
    Alarms.render();
  }
});

/* ——— V. World time ——— */
const CITIES = [
  { n: 'Baltimore', s: 'Maryland', tz: 'America/New_York', lat: 39.29, lon: -76.61 },
  { n: 'Washington', s: 'D.C. · Quantico', tz: 'America/New_York', lat: 38.52, lon: -77.29 },
  { n: 'Memphis', s: 'Tennessee', tz: 'America/Chicago', lat: 35.15, lon: -90.05 },
  { n: 'Florence', s: 'Firenze, Toscana', tz: 'Europe/Rome', lat: 43.77, lon: 11.26 },
  { n: 'Bimini', s: 'The Bahamas', tz: 'America/Nassau', lat: 25.73, lon: -79.3 }
];
function miniDial(cv, h, m, s, day) {
  const d = Math.min(devicePixelRatio || 1, 2), S = cv.clientWidth || 64; if (cv.width !== S * d) { cv.width = cv.height = S * d; }
  const x = cv.getContext('2d'), T = Watch.theme, M = METALS[T.metal], R = S / 2; x.setTransform(d, 0, 0, d, R * d, R * d); x.clearRect(-R, -R, S, S);
  x.beginPath(); x.arc(0, 0, R - 1, 0, TAU); x.fillStyle = metalConic(x, 0, 0, M, 0.4); x.fill();
  const g = x.createRadialGradient(-R * 0.3, -R * 0.3, 0, 0, 0, R); g.addColorStop(0, day ? T.dial[0] : mix(T.dial[1], '#000000', 0.2)); g.addColorStop(1, T.dial[1]);
  x.beginPath(); x.arc(0, 0, R * 0.84, 0, TAU); x.fillStyle = g; x.fill();
  x.fillStyle = T.print; for (let k = 0; k < 12; k++) { x.save(); x.rotate(k / 12 * TAU); x.fillRect(-0.8, -R * 0.78, 1.6, k % 3 ? R * 0.08 : R * 0.15); x.restore(); }
  const hand = (a, len, w, col) => { x.save(); x.rotate(a); x.fillStyle = col; x.beginPath(); x.moveTo(-w, R * 0.1); x.lineTo(0, -len); x.lineTo(w, R * 0.1); x.closePath(); x.fill(); x.restore(); };
  hand(((h % 12) + m / 60) / 12 * TAU, R * 0.45, R * 0.06, T.hand[0]); hand((m + s / 60) / 60 * TAU, R * 0.7, R * 0.045, T.hand[0]); hand(s / 60 * TAU, R * 0.75, R * 0.015, T.accent);
  x.beginPath(); x.arc(0, 0, R * 0.06, 0, TAU); x.fillStyle = T.accent; x.fill();
}
MODES.push({
  id: 'world', name: 'Fusi Orari', label: 'World', kicker: 'Complication V', icon: 'world', sub: 'Five cities the doctor has kept in mind.',
  build(el) {
    el.innerHTML = `<div class="cities">${CITIES.map((c, i) => `<div class="city" data-i="${i}"><canvas class="mini"></canvas><div class="c-name"><b>${c.n}</b><small>${c.s}</small></div><div class="c-time"><b class="mono">--:--</b><small></small></div><span class="dn"></span></div>`).join('')}</div>
      <p class="fine">Offsets are relative to your local time (<span id="w-local"></span>). Day or night comes from each city's actual solar altitude.</p>`;
  },
  tick(now) {
    if (now.getSeconds() === this._s && this._m === now.getMinutes()) return; this._s = now.getSeconds(); this._m = now.getMinutes();
    const localOff = -now.getTimezoneOffset();
    $('#w-local').textContent = Intl.DateTimeFormat().resolvedOptions().timeZone;
    $$('.city').forEach(row => { const c = CITIES[+row.dataset.i], z = zoneTime(c.tz, now), day = sunAltitude(c.lat, c.lon, now) > -0.83;
      miniDial($('canvas', row), z.h, z.m, z.s, day);
      $('.c-time b', row).textContent = Settings.h24 ? pad(z.h) + ':' + pad(z.m) : ((z.h % 12) || 12) + ':' + pad(z.m) + (z.h >= 12 ? ' PM' : ' AM');
      const diff = (z.offsetMin - localOff) / 60; $('.c-time small', row).textContent = z.dateStr + ' · ' + (diff === 0 ? 'local' : (diff > 0 ? '+' : '') + diff + ' h');
      const dn = $('.dn', row); dn.className = 'dn ' + (day ? 'day' : 'night'); dn.title = day ? 'Daylight' : 'Night'; });
  }
});

/* ——— VI. Moon ——— */
function drawMoonBig(cv, mp) {
  const d = Math.min(devicePixelRatio || 1, 2), S = cv.clientWidth || 200; cv.width = cv.height = S * d; const x = cv.getContext('2d'); x.scale(d, d); const R = S * 0.42, c = S / 2;
  const glow = x.createRadialGradient(c, c, R * 0.9, c, c, R * 1.25); glow.addColorStop(0, 'rgba(255,240,200,.18)'); glow.addColorStop(1, 'rgba(255,240,200,0)'); x.fillStyle = glow; x.fillRect(0, 0, S, S);
  const g = x.createRadialGradient(c - R * 0.3, c - R * 0.3, R * 0.1, c, c, R); g.addColorStop(0, '#fbf5e4'); g.addColorStop(1, '#bdb29a'); x.beginPath(); x.arc(c, c, R, 0, TAU); x.fillStyle = g; x.fill();
  const r = mulberry32(12); x.save(); x.beginPath(); x.arc(c, c, R, 0, TAU); x.clip();
  [[-.35, -.25, .3], [.2, -.35, .18], [.15, .2, .25], [-.2, .35, .15], [.45, .05, .12], [-.5, .1, .1]].forEach(([a, b, s]) => { x.beginPath(); x.arc(c + a * R, c + b * R, s * R, 0, TAU); x.fillStyle = 'rgba(110,100,80,.25)'; x.fill(); });
  for (let i = 0; i < 40; i++) { const a = r() * TAU, dd = Math.sqrt(r()) * R, s = r() * R * 0.05 + 1; x.beginPath(); x.arc(c + Math.cos(a) * dd, c + Math.sin(a) * dd, s, 0, TAU); x.strokeStyle = 'rgba(90,80,60,.25)'; x.stroke(); }
  // terminator: shadow = dark disc minus lit part. k = illum; ellipse x-radius = R*|1-2k|
  x.fillStyle = 'rgba(8,8,14,.9)'; x.beginPath();
  const lit = mp.waxing ? 1 : -1; // waxing: lit on right (northern hemisphere)
  x.arc(c, c, R + 0.5, Math.PI / 2, -Math.PI / 2, lit < 0); // dark half
  const ex = R * (1 - 2 * mp.illum); x.ellipse(c, c, Math.abs(ex), R + 0.5, 0, -Math.PI / 2, Math.PI / 2, (ex > 0) === (lit > 0) ? false : true);
  x.fill(); x.restore();
}
MODES.push({
  id: 'moon', name: 'Fasi Lunari', label: 'Moon', kicker: 'Complication VI', icon: 'moon', sub: 'Moon phase computed from lunar theory (Meeus), not approximated. The pointer date runs on the same sub-dial.',
  build(el) {
    el.innerHTML = `<div class="moon-hero"><canvas id="moon-big"></canvas><div><h3 id="mn-name">—</h3><p class="mn-stats"><span id="mn-ill"></span><br><span id="mn-age"></span></p></div></div>
      <div class="grid2"><div class="stat"><label>Next full moon</label><b id="mn-full"></b></div><div class="stat"><label>Next new moon</label><b id="mn-new"></b></div><div class="stat"><label>First quarter</label><b id="mn-fq"></b></div><div class="stat"><label>Last quarter</label><b id="mn-lq"></b></div></div>
      <div class="rule"></div><div class="cal-head"><button class="x" id="mn-prev" aria-label="previous month">‹</button><b id="mn-month"></b><button class="x" id="mn-next" aria-label="next month">›</button></div><div class="moon-cal" id="mn-cal"></div>`;
    this.off = 0; $('#mn-prev', el).onclick = () => { this.off--; this.cal(); }; $('#mn-next', el).onclick = () => { this.off++; this.cal(); };
  },
  show() { this.refresh(); },
  refresh() {
    const now = new Date(), mp = moonPhase(now); drawMoonBig($('#moon-big'), mp);
    $('#mn-name').textContent = mp.name; $('#mn-ill').textContent = (mp.illum * 100).toFixed(1) + '% illuminated · ' + (mp.waxing ? 'waxing' : 'waning');
    $('#mn-age').textContent = 'Age ' + mp.age.toFixed(1) + ' days of 29.53';
    const f = (t) => { const d = nextMoonEvent(t, now); return d ? d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ', ' + fmtClock(d) : '—'; };
    $('#mn-full').textContent = f(0.5); $('#mn-new').textContent = f(0); $('#mn-fq').textContent = f(0.25); $('#mn-lq').textContent = f(0.75); this.cal();
  },
  cal() {
    const now = new Date(), base = new Date(now.getFullYear(), now.getMonth() + this.off, 1), days = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
    $('#mn-month').textContent = base.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    let h = ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => `<i>${d}</i>`).join('') + '<span></span>'.repeat(base.getDay());
    for (let d = 1; d <= days; d++) { const dt = new Date(base.getFullYear(), base.getMonth(), d, 21), mp = moonPhase(dt), today = this.off === 0 && d === now.getDate();
      const ex = 50 * (1 - 2 * mp.illum);
      h += `<span class="${today ? 'today' : ''}" title="${mp.name}, ${Math.round(mp.illum * 100)}%"><svg viewBox="-50 -50 100 100"><circle r="46" class="lit"/><path class="drk" d="M0,-46 A46,46 0 0 ${mp.waxing ? 0 : 1} 0,46 A${Math.abs(ex) * 0.92},46 0 0 ${(ex > 0) !== mp.waxing ? 1 : 0} 0,-46z"/></svg><em>${d}</em></span>`; }
    $('#mn-cal').innerHTML = h;
  }
});

/* ——— VII. Case back ——— */
MODES.push({
  id: 'back', name: 'Fondello', label: 'Case back', kicker: 'Complication VII', icon: 'back', sub: 'Exhibition case back. Calibre C-1991, hand-finished by Cinco Corporation.',
  build(el) {
    el.innerHTML = `<dl class="specs"><dt>Movement</dt><dd>Calibre C-1991, automatic, column-wheel chronograph</dd><dt>Frequency</dt><dd>28,800 vph (4 Hz), 42 jewels</dd><dt>Finishing</dt><dd>Côtes de Genève, perlage, hand-bevelled bridges, flame-blued screws</dd><dt>Rotor</dt><dd>Openworked 22k gold, engraved <span class="sc">Cinco Corporation</span></dd><dt>Inscription</dt><dd><em class="script">for a mind of refined taste</em></dd></dl>
      <label class="lbl">Power reserve <b id="cb-pr"></b></label><div class="meter"><span id="cb-bar"></span></div>
      <div class="btn-row"><button class="btn primary" id="cb-wind">Hold to wind the crown</button></div>
      <label class="lbl">Observation speed</label><div class="seg" id="cb-speed"><button data-v="1" class="on">Real time</button><button data-v="0.25">¼ ×</button><button data-v="0.05">1/20 ×</button></div>
      <p class="fine">Drag across the case back to spin the rotor, which winds the watch. On a phone, tilting it lets the rotor swing under gravity. Balance amplitude drops as the power reserve runs down. Press <kbd>K</kbd> to turn the watch over from any mode.</p>`;
    $$('#cb-speed button', el).forEach(b => b.onclick = () => { $$('#cb-speed button').forEach(x => x.classList.remove('on')); b.classList.add('on'); CaseBack.speed = +b.dataset.v; });
    let hold = null; const w = $('#cb-wind', el);
    const start = (e) => { e.preventDefault(); Snd.ensure(); clearInterval(hold); hold = setInterval(() => { CaseBack.wind(0.012); Watch.crownRot += 2; Snd.tick(0.08); }, 60); };
    const stop = () => clearInterval(hold);
    w.addEventListener('pointerdown', start); ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => w.addEventListener(ev, stop));
  },
  show() { App.flip(true); }, hide() { App.flip(false); },
  tick() { const p = CaseBack.power; $('#cb-pr').textContent = Math.round(p * 42) + ' h of 42'; $('#cb-bar').style.width = (p * 100) + '%'; }
});
