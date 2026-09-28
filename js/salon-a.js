/* Ring II · Salone — I. Tourbillon · II. Minute repeater · III. Sun & golden hour · IV. Star chart */
'use strict';
Object.assign(ICON, {
  tourb: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.2"/><path d="M12 3.5v5.3M19.4 16.3l-4.6-2.7M4.6 16.3l4.6-2.7"/>',
  repeater: '<path d="M5 18c0-6 3-11 7-11s7 5 7 11"/><path d="M3 18h18M12 4v3M9 21h6"/>',
  sun: '<circle cx="12" cy="14" r="4"/><path d="M2.5 18h19M12 5v2.5M5.3 8.3l1.7 1.7M18.7 8.3L17 10M3 14h2M19 14h2"/>',
  stars: '<path d="M12 3l1.6 4.2L18 7.6l-3.4 2.8 1.1 4.4L12 12.4l-3.7 2.4 1.1-4.4L6 7.6l4.4-.4z"/><path d="M5 19l2 1M17 18.5l2.5-1M11 21h1"/>',
  sessions: '<path d="M6 21v-6a6 6 0 0 1 12 0v6"/><path d="M12 3v3M8 21h8"/><circle cx="12" cy="15" r="2"/>',
  notes: '<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4M9 11h7M9 14h7M9 17h4"/>',
  cellar: '<path d="M9 3h6M10 3v4c-2 1-3 3-3 5v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-8c0-2-1-4-3-5V3"/><path d="M7 14h10"/>',
  bespoke: '<path d="M9 2.5h6l1 5H8zM8 16.5h8l-1 5H9z"/><circle cx="12" cy="12" r="4.5"/>',
  engrave: '<path d="M4 20l6-6M14 4l6 6-8 8-6-6z"/><path d="M4 20h6"/>',
  ambience: '<path d="M4 10v4M8 7v10M12 4v16M16 8v8M20 11v2"/>',
  night: '<path d="M4 18h16M6 18v-5a6 6 0 0 1 12 0v5"/><path d="M15 6a3 3 0 1 1-3-3 2.4 2.4 0 0 0 3 3z"/>',
  vetrina: '<rect x="3" y="6" width="18" height="13" rx="2"/><circle cx="12" cy="12.5" r="3.5"/><path d="M8 6l1.5-2.5h5L16 6"/>',
  secrets: '<path d="M8 3h8v5a4 4 0 0 1-8 0zM8 5H4.5a3 3 0 0 0 3.5 4M16 5h3.5a3 3 0 0 1-3.5 4M12 12v4M8.5 21h7l-1-5h-5z"/>'
});

/* ——— I. Tourbillon ——— */
MODES.push({
  id: 'tourbillon', page: 2, name: 'Turbine', label: 'Tourbillon', kicker: 'Salone I', icon: 'tourb', sub: 'A carriage that turns once a minute, taking the escapement with it so gravity has no favourite position.',
  build(el) {
    el.innerHTML = `<div class="tb-wrap"><canvas id="tb-cv" aria-label="Close-up of the rotating tourbillon carriage"></canvas><div class="tb-sec" id="tb-sec">00</div></div>
      <div class="seg" id="tb-speed" role="group" aria-label="Carriage speed"><button data-v="1" class="on">Real time</button><button data-v="0.08">Slow motion</button><button data-v="6">Six times faster</button></div>
      <label class="chk" style="margin-top:12px"><input type="checkbox" id="tb-keep"> Keep the tourbillon aperture on the dial (in place of the moon)</label>
      <div class="grid2" style="margin-top:12px"><div class="stat"><label>Carriage</label><b>60 s / turn</b><small>its red tip doubles as the seconds</small></div><div class="stat"><label>Balance</label><b>4 Hz</b><small>28,800 vibrations an hour</small></div></div>
      <p class="fine">In the carriage: the escape wheel rolls around the fixed gold seconds wheel, the lever flicks between its rubies, and the balance breathes on its blued hairspring. The polished bridge on top does not turn. Watch a full minute and something may happen.</p>`;
    this.speed = 1; this.sim = performance.now() / 1000; this.seen = 0;
    $$('#tb-speed button', el).forEach(b => b.onclick = () => { $$('#tb-speed button').forEach(x => x.classList.toggle('on', x === b)); this.speed = +b.dataset.v; });
    $('#tb-keep', el).checked = Settings.tourbillonDial; $('#tb-keep', el).onchange = (e) => { setSetting('tourbillonDial', e.target.checked); toast(e.target.checked ? 'Tourbillon aperture fitted' : 'The moon returns to six o\'clock'); };
  },
  show() { Watch.tourbTemp = true; this.seen = 0; },
  hide() { Watch.tourbTemp = false; },
  frame(dt) {
    const cv = $('#tb-cv'); if (!cv || !cv.clientWidth) return; const d = Math.min(devicePixelRatio || 1, 2), W = cv.clientWidth; if (cv.width !== Math.round(W * d)) { cv.width = cv.height = Math.round(W * d); }
    this.sim += dt * this.speed; this.seen += dt * this.speed; if (this.seen >= 60) { Bus.emit('ach', 'tourb'); this.seen = -1e9; }
    const x = cv.getContext('2d'); x.setTransform(d, 0, 0, d, 0, 0); x.clearRect(0, 0, W, W);
    const R = W * 0.46; x.save(); x.shadowColor = 'rgba(0,0,0,.6)'; x.shadowBlur = 24; x.beginPath(); x.arc(W / 2, W / 2, R * 1.04, 0, TAU); x.fillStyle = metalConic(x, W / 2, W / 2, Watch.M(), 0.4); x.fill(); x.restore();
    Tourbillon.draw(x, W / 2, W / 2, R, this.sim, { metal: Watch.M() });
    const g = x.createRadialGradient(W * 0.35, W * 0.3, 0, W * 0.35, W * 0.3, R * 1.2); g.addColorStop(0, 'rgba(255,255,255,.12)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.beginPath(); x.arc(W / 2, W / 2, R, 0, TAU); x.fill();
    $('#tb-sec').textContent = pad(Math.floor(this.sim % 60));
  }
});

/* ——— II. Minute repeater ——— */
const Repeater = {
  busy: false,
  strike(now = new Date()) {
    if (this.busy) return; Snd.ensure(); if (!Snd.ctx) return;
    const h = now.getHours() % 12 || 12, m = now.getMinutes(), q = Math.floor(m / 15), mm = m % 15;
    const sch = Snd.repeater(h, q, mm); if (!sch) return; this.busy = true; this.sch = sch; this.counts = { h, q, m: mm }; Watch.repSlide = 1; Snd.click();
    if (m === 0) Bus.emit('ach', 'hour');
    setTimeout(() => { this.busy = false; this.sch = null; Bus.emit('repeater', 'done'); }, (sch.end - sch.t0) * 1000 + 300);
    Bus.emit('repeater', 'start'); return { h, q, m: mm };
  }
};
MODES.push({
  id: 'repeater', page: 2, name: 'Ripetizione', label: 'Repeater', kicker: 'Salone II', icon: 'repeater', sub: 'Push the slide and the watch strikes the time on two gongs: hours, then quarters, then minutes.',
  build(el) {
    el.innerHTML = `<canvas id="rp-cv" class="rp-cv" aria-label="The two repeater gongs and their hammers"></canvas>
      <div class="rp-counts"><div><label>Hours</label><b id="rp-h">–</b><small>low gong</small></div><div><label>Quarters</label><b id="rp-q">–</b><small>ding-dong</small></div><div><label>Minutes</label><b id="rp-m">–</b><small>high gong</small></div></div>
      <div class="btn-row"><button class="btn primary" id="rp-go">Strike the time</button><button class="btn" id="rp-say">Speak the time</button></div>
      <p class="fine">You can also slide the lever on the left flank of the case (between eight and nine o'clock), or press <kbd>C</kbd> from anywhere. At 7:41 you would hear seven low strikes, two ding-dongs and eleven high strikes. A governor keeps the train at an even pace; you can hear it whirr faintly.</p>`;
    $('#rp-go', el).onclick = () => this.go(); $('#rp-say', el).onclick = () => Voice.sayTime(true);
    this.hit = { low: 0, high: 0 };
    Bus.on('repeater', (s) => { if (s === 'start') this.fill(); });
  },
  go() { const r = Repeater.strike(); if (r) this.fill(); },
  fill() { const c = Repeater.counts; if (!c || !$('#rp-h')) return; $('#rp-h').textContent = c.h; $('#rp-q').textContent = c.q; $('#rp-m').textContent = c.m; },
  frame() {
    const cv = $('#rp-cv'); if (!cv || !cv.clientWidth) return; const d = Math.min(devicePixelRatio || 1, 2), W = cv.clientWidth, H = cv.clientHeight; if (cv.width !== Math.round(W * d)) { cv.width = Math.round(W * d); cv.height = Math.round(H * d); }
    const x = cv.getContext('2d'); x.setTransform(d, 0, 0, d, 0, 0); x.clearRect(0, 0, W, H);
    const now = Snd.ctx ? Snd.ctx.currentTime : 0, sch = Repeater.sch, M = Watch.M();
    const strikeAmt = (g) => { if (!sch) return 0; let v = 0; sch.ev.forEach(e => { if (e.g !== g) return; const dt = now - e.t; if (dt > -0.12 && dt < 0) v = Math.max(v, (dt + 0.12) / 0.12 * 0.6); if (dt >= 0 && dt < 0.5) v = Math.max(v, Math.exp(-dt * 9) * -0.4 + 0); }); return v; };
    const ring = (g) => { if (!sch) return 0; let v = 0; sch.ev.forEach(e => { if (e.g === g && now >= e.t) v = Math.max(v, Math.exp(-(now - e.t) * 2.5)); }); return v; };
    // movement plate
    const bg = x.createLinearGradient(0, 0, W, H); bg.addColorStop(0, '#2a2c30'); bg.addColorStop(1, '#101114'); x.fillStyle = bg; roundRect(x, 0, 0, W, H, 12); x.fill();
    const cx = W * 0.5, cy = H * 1.25, R1 = H * 1.02, R2 = H * 0.9;
    [[R1, 'low'], [R2, 'high']].forEach(([rr, g]) => { const v = ring(g), wob = Math.sin(now * 90) * v * 1.4;
      x.beginPath(); x.arc(cx, cy, rr + wob, Math.PI * 1.12, Math.PI * 1.88); x.lineWidth = 3; x.strokeStyle = v > 0.02 ? `rgba(255,${220 - v * 40 | 0},${150 - v * 60 | 0},${0.7 + v * 0.3})` : '#b8bec6'; x.shadowColor = v > 0.02 ? 'rgba(255,200,120,.8)' : 'transparent'; x.shadowBlur = v * 16; x.stroke(); x.shadowBlur = 0;
      x.fillStyle = M[1]; x.beginPath(); x.arc(cx + Math.cos(Math.PI * 1.88) * rr, cy + Math.sin(Math.PI * 1.88) * rr, 7, 0, TAU); x.fill(); });
    x.fillStyle = 'rgba(236,228,210,.5)'; x.font = '600 10px Cinzel, serif'; x.textAlign = 'left';
    // hammers
    [['low', W * 0.3, R1], ['high', W * 0.42, R2]].forEach(([g, hx, rr]) => {
      const a = strikeAmt(g), py = cy - Math.sqrt(Math.max(0, rr * rr - (hx - cx) * (hx - cx))), px = hx;
      x.save(); x.translate(px - 40, py - 26); x.rotate(0.35 - a * 0.5 + (a < 0 ? 0 : 0));
      const hg = x.createLinearGradient(0, -6, 0, 6); hg.addColorStop(0, M[0]); hg.addColorStop(1, M[2]); x.fillStyle = hg; roundRect(x, 0, -4, 44, 8, 3); x.fill(); x.beginPath(); x.arc(46, 0, 8, 0, TAU); x.fill(); x.beginPath(); x.arc(0, 0, 5, 0, TAU); x.fillStyle = '#c0142e'; x.fill(); x.restore();
    });
    // governor
    const gv = sch ? now * 40 : 0; x.save(); x.translate(W - 44, 34); x.rotate(gv); x.strokeStyle = M[1]; x.lineWidth = 3; for (let k = 0; k < 2; k++) { x.rotate(Math.PI); x.beginPath(); x.moveTo(0, 0); x.lineTo(18, 0); x.stroke(); x.fillStyle = M[0]; x.fillRect(16, -6, 5, 12); } x.restore();
    x.fillStyle = 'rgba(236,228,210,.45)'; x.textAlign = 'center'; x.fillText('GOVERNOR', W - 44, 68);
  },
  key(e) { if (e.key === 'Enter') { this.go(); return true; } }
});

/* ——— III. Sun, golden hour & daylight arc ——— */
MODES.push({
  id: 'sun', page: 2, name: 'Sole', label: 'Sun', kicker: 'Salone III', icon: 'sun', sub: 'Sunrise, sunset and the golden hour for your chosen place, with the day drawn as an arc.',
  build(el) {
    el.innerHTML = `<div class="sun-loc"><div><label class="lbl" style="margin:0">Location</label><b id="sn-name"></b><small id="sn-coord"></small></div><button class="btn" id="sn-geo">Use my location</button></div>
      <canvas id="sn-cv" class="sn-cv" aria-label="Daylight arc showing the sun's altitude through the day"></canvas>
      <p class="sn-next" id="sn-next"></p>
      <div class="grid2 sun-grid">
        <div class="stat"><label>Sunrise</label><b id="sn-rise">–</b><small id="sn-dawn"></small></div><div class="stat"><label>Sunset</label><b id="sn-set">–</b><small id="sn-dusk"></small></div>
        <div class="stat gold"><label>Golden hour · morning</label><b id="sn-gam">–</b><small>sun below 6°</small></div><div class="stat gold"><label>Golden hour · evening</label><b id="sn-gpm">–</b><small>the flattering light</small></div>
        <div class="stat blue"><label>Blue hour</label><b id="sn-blue">–</b><small>sun 4° to 6° below</small></div><div class="stat"><label>Solar noon</label><b id="sn-noon">–</b><small id="sn-alt"></small></div>
        <div class="stat"><label>Day length</label><b id="sn-len">–</b><small id="sn-delta"></small></div><div class="stat"><label>Sun now</label><b id="sn-now">–</b><small id="sn-now2"></small></div>
      </div>
      <details class="sn-man"><summary>Enter coordinates by hand</summary><div class="hms"><input type="number" id="sn-lat" step="0.0001" aria-label="Latitude" placeholder="Latitude"><input type="number" id="sn-lon" step="0.0001" aria-label="Longitude" placeholder="Longitude"><button class="btn" id="sn-set-btn">Set</button><button class="btn ghost" id="sn-reset">Weatherford, TX</button></div></details>
      <p class="fine">Times are shown in this device's time zone. Your location is only used on this device and is never sent anywhere; the watch asks the browser for it only when you press the button.</p>`;
    $('#sn-geo', el).onclick = () => {
      if (!navigator.geolocation) return toast('Geolocation is not available here');
      toast('Asking the browser for your location…');
      navigator.geolocation.getCurrentPosition(p => { Loc.set({ lat: +p.coords.latitude.toFixed(4), lon: +p.coords.longitude.toFixed(4), name: 'Your location' }); toast('Location set'); }, () => toast('Location was not shared. Weatherford it is.'), { timeout: 10000, maximumAge: 600000 });
    };
    $('#sn-set-btn', el).onclick = () => { const la = +$('#sn-lat').value, lo = +$('#sn-lon').value; if (!isFinite(la) || !isFinite(lo) || Math.abs(la) > 90 || Math.abs(lo) > 180 || ($('#sn-lat').value === '')) return toast('Latitude −90…90, longitude −180…180'); Loc.set({ lat: la, lon: lo, name: 'Custom location' }); };
    $('#sn-reset', el).onclick = () => Loc.set(Loc.DEF);
    Bus.on('loc', () => { this.day = null; this.tick(new Date(), true); });
  },
  show() { this.day = null; },
  tick(now, force) {
    if (!force && this._s === now.getMinutes() && this.day) { return; } this._s = now.getMinutes();
    const L = Loc.get(); const key = now.toDateString() + L.lat + L.lon;
    if (!this.day || this.dayKey !== key) { this.day = solarDay(now, L.lat, L.lon); const y = new Date(now); y.setDate(y.getDate() - 1); this.yday = solarDay(y, L.lat, L.lon); this.dayKey = key; }
    const D = this.day, f = (d) => d ? fmtClock(d) : '—';
    $('#sn-name').textContent = L.name; $('#sn-coord').textContent = Loc.fmt(L); $('#sn-lat').placeholder = L.lat; $('#sn-lon').placeholder = L.lon;
    $('#sn-rise').textContent = f(D.rise); $('#sn-set').textContent = f(D.set); $('#sn-dawn').textContent = D.dawn ? 'first light ' + f(D.dawn) : ''; $('#sn-dusk').textContent = D.dusk ? 'last light ' + f(D.dusk) : '';
    $('#sn-gam').textContent = D.rise && D.goldAmEnd ? f(D.rise) + ' – ' + f(D.goldAmEnd) : '—'; $('#sn-gpm').textContent = D.goldPmStart && D.set ? f(D.goldPmStart) + ' – ' + f(D.set) : '—';
    $('#sn-blue').textContent = D.bluePmStart && D.dusk ? f(D.bluePmStart) + ' – ' + f(D.dusk) : '—';
    $('#sn-noon').textContent = f(D.noon); $('#sn-alt').textContent = 'sun at ' + D.noonAlt.toFixed(1) + '°';
    const len = (d) => d.rise && d.set ? d.set - d.rise : null, l0 = len(D), l1 = len(this.yday);
    $('#sn-len').textContent = l0 ? Math.floor(l0 / 3600000) + ' h ' + pad(Math.round(l0 / 60000) % 60) + ' m' : (D.noonAlt > 0 ? 'Midnight sun' : 'Polar night');
    if (l0 && l1) { const dm = (l0 - l1) / 60000; $('#sn-delta').textContent = (dm >= 0 ? '+' : '−') + Math.abs(dm).toFixed(1) + ' min vs yesterday'; }
    const a = sunAltitude(L.lat, L.lon, now); $('#sn-now').textContent = a.toFixed(1) + '°'; $('#sn-now2').textContent = a > 6 ? 'daylight' : a > -0.833 ? 'golden hour' : a > -4 ? 'civil twilight' : a > -6 ? 'blue hour' : a > -12 ? 'nautical twilight' : 'night';
    // next event line
    const evs = [[D.rise, 'Sunrise'], [D.goldAmEnd, 'Morning golden hour ends'], [D.goldPmStart, 'Golden hour begins'], [D.set, 'Sunset'], [D.dusk, 'Blue hour ends']].filter(e => e[0] && e[0] > now).sort((p, q) => p[0] - q[0]);
    $('#sn-next').innerHTML = evs.length ? `<em>${evs[0][1]}</em> in ${fmtDur(evs[0][0] - now, false).replace(/^(\d+):(\d+):\d+$/, '$1 h $2 min').replace(/^(\d+):(\d+)$/, '$1 min')} · at ${fmtClock(evs[0][0])}` : 'The sun has finished for today. Tomorrow it rises again, as it tends to.';
    this.draw(now);
  },
  draw(now) {
    const cv = $('#sn-cv'); if (!cv || !cv.clientWidth) return; const d = Math.min(devicePixelRatio || 1, 2), W = cv.clientWidth, H = cv.clientHeight; cv.width = Math.round(W * d); cv.height = Math.round(H * d);
    const x = cv.getContext('2d'); x.setTransform(d, 0, 0, d, 0, 0); const D = this.day, S = D.S, N = S.length - 1, pad2 = 14;
    const maxA = Math.max(20, Math.ceil(D.noonAlt / 10) * 10 + 5), minA = -Math.max(20, Math.ceil(-Math.min(...S) / 10) * 10);
    const X = (i) => pad2 + i / N * (W - pad2 * 2), Y = (a) => pad2 + (maxA - a) / (maxA - minA) * (H - pad2 * 2 - 14);
    // sky bands
    const bands = [[maxA, 6, 'rgba(120,160,210,.14)'], [6, -0.833, 'rgba(230,170,80,.28)'], [-0.833, -4, 'rgba(210,120,90,.16)'], [-4, -6, 'rgba(70,90,200,.24)'], [-6, minA, 'rgba(10,12,30,.5)']];
    bands.forEach(([a, b, c]) => { x.fillStyle = c; x.fillRect(pad2, Y(a), W - pad2 * 2, Y(b) - Y(a)); });
    x.strokeStyle = 'rgba(236,228,210,.45)'; x.lineWidth = 1; x.beginPath(); x.moveTo(pad2, Y(0)); x.lineTo(W - pad2, Y(0)); x.stroke();
    x.fillStyle = 'rgba(236,228,210,.5)'; x.font = '10px Cinzel, serif'; x.textAlign = 'center';
    for (let h = 0; h <= 24; h += 3) { const xx = pad2 + h / 24 * (W - pad2 * 2); x.fillText(Settings.h24 ? pad(h % 24) : ((h % 12) || 12) + (h % 24 < 12 ? 'a' : 'p'), xx, H - 4); x.fillRect(xx, Y(0) - 2, 1, 4); }
    // path of the sun
    x.beginPath(); S.forEach((a, i) => i ? x.lineTo(X(i), Y(a)) : x.moveTo(X(i), Y(a)));
    const g = x.createLinearGradient(0, Y(maxA), 0, Y(minA)); g.addColorStop(0, '#ffe6a0'); g.addColorStop(0.5, '#e7a64a'); g.addColorStop(1, '#4a5aa8'); x.strokeStyle = g; x.lineWidth = 2.2; x.stroke();
    // daylight fill
    x.save(); x.beginPath(); x.rect(pad2, Y(maxA), W - pad2 * 2, Y(0) - Y(maxA)); x.clip(); x.beginPath(); S.forEach((a, i) => i ? x.lineTo(X(i), Y(a)) : x.moveTo(X(i), Y(a))); x.lineTo(X(N), Y(0)); x.lineTo(X(0), Y(0)); x.closePath(); x.fillStyle = 'rgba(255,214,130,.12)'; x.fill(); x.restore();
    // now marker
    const fi = (now - D.t0) / D.step; if (fi >= 0 && fi <= N) { const a = S[Math.min(N, Math.round(fi))], px = X(fi), py = Y(a);
      x.strokeStyle = 'rgba(236,228,210,.25)'; x.setLineDash([3, 4]); x.beginPath(); x.moveTo(px, pad2); x.lineTo(px, H - 16); x.stroke(); x.setLineDash([]);
      const sg = x.createRadialGradient(px, py, 0, px, py, 16); sg.addColorStop(0, a > 0 ? 'rgba(255,240,190,1)' : 'rgba(200,210,255,.9)'); sg.addColorStop(0.35, a > 0 ? 'rgba(255,190,90,.8)' : 'rgba(120,140,220,.5)'); sg.addColorStop(1, 'rgba(255,190,90,0)'); x.fillStyle = sg; x.beginPath(); x.arc(px, py, 16, 0, TAU); x.fill(); }
    [[D.rise, '↑'], [D.set, '↓']].forEach(([t, s]) => { if (!t) return; const i = (t - D.t0) / D.step; x.fillStyle = '#ffd88a'; x.font = '12px serif'; x.fillText(s, X(i), Y(0) - 6); });
  }
});

/* ——— IV. Star chart ——— */
const STARS = [ // name, RA (h), Dec (°), magnitude
  ['Sirius', 6.752, -16.716, -1.46], ['Canopus', 6.399, -52.696, -0.74], ['Arcturus', 14.261, 19.182, -0.05], ['Vega', 18.616, 38.784, 0.03], ['Capella', 5.278, 45.998, 0.08], ['Rigel', 5.242, -8.202, 0.13],
  ['Procyon', 7.655, 5.225, 0.34], ['Betelgeuse', 5.919, 7.407, 0.5], ['Achernar', 1.629, -57.237, 0.46], ['Hadar', 14.064, -60.373, 0.61], ['Altair', 19.846, 8.868, 0.76], ['Acrux', 12.443, -63.099, 0.76],
  ['Aldebaran', 4.599, 16.509, 0.86], ['Spica', 13.42, -11.161, 0.97], ['Antares', 16.49, -26.432, 1.06], ['Pollux', 7.755, 28.026, 1.14], ['Fomalhaut', 22.961, -29.622, 1.16], ['Deneb', 20.69, 45.28, 1.25],
  ['Mimosa', 12.795, -59.689, 1.25], ['Regulus', 10.139, 11.967, 1.36], ['Adhara', 6.977, -28.972, 1.5], ['Castor', 7.577, 31.888, 1.58], ['Shaula', 17.56, -37.104, 1.62], ['Gacrux', 12.519, -57.113, 1.63],
  ['Bellatrix', 5.419, 6.35, 1.64], ['Elnath', 5.438, 28.608, 1.65], ['Alnilam', 5.604, -1.202, 1.69], ['Alnitak', 5.679, -1.943, 1.77], ['Mintaka', 5.533, -0.299, 2.23], ['Saiph', 5.796, -9.67, 2.09], ['Meissa', 5.585, 9.934, 3.33],
  ['Alioth', 12.9, 55.96, 1.76], ['Dubhe', 11.062, 61.751, 1.79], ['Merak', 11.031, 56.382, 2.37], ['Phecda', 11.897, 53.695, 2.44], ['Megrez', 12.257, 57.033, 3.31], ['Mizar', 13.399, 54.925, 2.23], ['Alkaid', 13.792, 49.313, 1.86],
  ['Polaris', 2.53, 89.264, 1.98], ['Schedar', 0.675, 56.537, 2.24], ['Caph', 0.153, 59.15, 2.28], ['Navi', 0.945, 60.717, 2.15], ['Ruchbah', 1.43, 60.235, 2.66], ['Segin', 1.907, 63.67, 3.35],
  ['Sadr', 20.37, 40.257, 2.23], ['Aljanah', 20.77, 33.97, 2.48], ['Fawaris', 19.75, 45.131, 2.87], ['Albireo', 19.512, 27.96, 3.05],
  ['Sheliak', 18.835, 33.363, 3.52], ['Sulafat', 18.982, 32.69, 3.25], ['ζ Lyr', 18.746, 37.605, 4.3], ['δ Lyr', 18.908, 36.899, 4.3],
  ['Denebola', 11.818, 14.572, 2.14], ['Algieba', 10.333, 19.842, 2.08], ['Zosma', 11.235, 20.524, 2.56], ['Chertan', 11.237, 15.43, 3.33], ['Ras Elased', 9.764, 23.774, 2.98], ['Adhafera', 10.278, 23.417, 3.44], ['η Leo', 10.122, 16.763, 3.49],
  ['Alhena', 6.628, 16.399, 1.93], ['Wasat', 7.335, 21.982, 3.53], ['Mebsuta', 6.732, 25.131, 3.06], ['Tejat', 6.383, 22.514, 2.87],
  ['Alcyone', 3.791, 24.105, 2.87], ['ζ Tau', 5.627, 21.143, 3.0], ['γ Tau', 4.33, 15.628, 3.65], ['ε Tau', 4.477, 19.18, 3.53],
  ['Tarazed', 19.771, 10.613, 2.72], ['Alshain', 19.922, 6.407, 3.71],
  ['Sargas', 17.622, -42.998, 1.87], ['Dschubba', 16.006, -22.622, 2.29], ['Acrab', 16.091, -19.805, 2.62], ['π Sco', 15.981, -26.114, 2.89], ['σ Sco', 16.353, -25.593, 2.9], ['τ Sco', 16.598, -28.216, 2.82], ['ε Sco', 16.836, -34.293, 2.29], ['μ Sco', 16.864, -38.047, 3.0], ['ζ Sco', 16.91, -42.36, 3.62], ['η Sco', 17.203, -43.239, 3.33], ['ι Sco', 17.793, -40.127, 2.99], ['κ Sco', 17.708, -39.03, 2.39],
  ['Mirzam', 6.378, -17.956, 1.98], ['Wezen', 7.14, -26.393, 1.83], ['Aludra', 7.402, -29.303, 2.45], ['Furud', 6.338, -30.063, 3.02],
  ['Markab', 23.079, 15.205, 2.49], ['Scheat', 23.063, 28.083, 2.42], ['Algenib', 0.22, 15.184, 2.83], ['Alpheratz', 0.14, 29.091, 2.06],
  ['Izar', 14.75, 27.074, 2.37], ['Muphrid', 13.911, 18.398, 2.68], ['Seginus', 14.535, 38.308, 3.03], ['Nekkar', 15.032, 40.391, 3.5], ['δ Boo', 15.258, 33.315, 3.47], ['δ Cru', 12.252, -58.749, 2.79],
  ['Mirach', 1.162, 35.621, 2.05], ['Almach', 2.065, 42.33, 2.1], ['Hamal', 2.12, 23.462, 2.0], ['Mirfak', 3.405, 49.861, 1.79], ['Algol', 3.136, 40.956, 2.12], ['Rasalhague', 17.582, 12.56, 2.08], ['Kochab', 14.845, 74.156, 2.08], ['Eltanin', 17.943, 51.489, 2.23], ['Alphard', 9.46, -8.659, 1.98], ['Nunki', 18.921, -26.297, 2.05], ['Kaus Australis', 18.403, -34.385, 1.85], ['Peacock', 20.427, -56.735, 1.94], ['Alnair', 22.137, -46.961, 1.74], ['Menkar', 3.038, 4.09, 2.54], ['Diphda', 0.726, -17.987, 2.04], ['Zubenelgenubi', 14.848, -16.042, 2.75], ['Alphecca', 15.578, 26.715, 2.23]
];
const CONST = {
  Orion: [['Betelgeuse', 'Bellatrix'], ['Betelgeuse', 'Alnitak'], ['Bellatrix', 'Mintaka'], ['Mintaka', 'Alnilam'], ['Alnilam', 'Alnitak'], ['Alnitak', 'Saiph'], ['Mintaka', 'Rigel'], ['Saiph', 'Rigel'], ['Betelgeuse', 'Meissa'], ['Meissa', 'Bellatrix']],
  'Ursa Major': [['Dubhe', 'Merak'], ['Merak', 'Phecda'], ['Phecda', 'Megrez'], ['Megrez', 'Dubhe'], ['Megrez', 'Alioth'], ['Alioth', 'Mizar'], ['Mizar', 'Alkaid']],
  Cassiopeia: [['Caph', 'Schedar'], ['Schedar', 'Navi'], ['Navi', 'Ruchbah'], ['Ruchbah', 'Segin']],
  Cygnus: [['Deneb', 'Sadr'], ['Sadr', 'Albireo'], ['Aljanah', 'Sadr'], ['Sadr', 'Fawaris']],
  Lyra: [['Vega', 'ζ Lyr'], ['ζ Lyr', 'δ Lyr'], ['δ Lyr', 'Sulafat'], ['Sulafat', 'Sheliak'], ['Sheliak', 'ζ Lyr']],
  Leo: [['Regulus', 'η Leo'], ['η Leo', 'Algieba'], ['Algieba', 'Zosma'], ['Zosma', 'Denebola'], ['Denebola', 'Chertan'], ['Chertan', 'Regulus'], ['Algieba', 'Adhafera'], ['Adhafera', 'Ras Elased']],
  Gemini: [['Castor', 'Mebsuta'], ['Mebsuta', 'Tejat'], ['Pollux', 'Wasat'], ['Wasat', 'Alhena'], ['Castor', 'Pollux']],
  Taurus: [['Aldebaran', 'γ Tau'], ['Aldebaran', 'ε Tau'], ['ε Tau', 'Elnath'], ['Aldebaran', 'ζ Tau']],
  Scorpius: [['Acrab', 'Dschubba'], ['Dschubba', 'π Sco'], ['Dschubba', 'σ Sco'], ['σ Sco', 'Antares'], ['Antares', 'τ Sco'], ['τ Sco', 'ε Sco'], ['ε Sco', 'μ Sco'], ['μ Sco', 'ζ Sco'], ['ζ Sco', 'η Sco'], ['η Sco', 'Sargas'], ['Sargas', 'ι Sco'], ['ι Sco', 'κ Sco'], ['κ Sco', 'Shaula']],
  'Canis Major': [['Mirzam', 'Sirius'], ['Sirius', 'Adhara'], ['Adhara', 'Wezen'], ['Wezen', 'Aludra'], ['Adhara', 'Furud']],
  Aquila: [['Tarazed', 'Altair'], ['Altair', 'Alshain']],
  Pegasus: [['Markab', 'Scheat'], ['Scheat', 'Alpheratz'], ['Alpheratz', 'Algenib'], ['Algenib', 'Markab']],
  Boötes: [['Arcturus', 'Izar'], ['Izar', 'δ Boo'], ['δ Boo', 'Nekkar'], ['Nekkar', 'Seginus'], ['Seginus', 'Arcturus'], ['Arcturus', 'Muphrid']],
  Crux: [['Acrux', 'Gacrux'], ['Mimosa', 'δ Cru']]
};
function lst(date, lon) { const d = date.getTime() / 86400000 - 10957.5; return ((280.46061837 + 360.98564736629 * d + lon) % 360 + 360) % 360; }
function altAz(raDeg, dec, lat, lstDeg) {
  const r = Math.PI / 180, H = (lstDeg - raDeg) * r, sd = Math.sin(dec * r), cd = Math.cos(dec * r), sl = Math.sin(lat * r), cl = Math.cos(lat * r);
  const alt = Math.asin(sd * sl + cd * cl * Math.cos(H)); const az = Math.atan2(-Math.sin(H) * cd, sd * cl - cd * sl * Math.cos(H));
  return { alt: alt / r, az: ((az / r) + 360) % 360 };
}
function moonRaDec(date) {
  const r = Math.PI / 180, d = date.getTime() / 86400000 - 10957.5;
  const L = 218.316 + 13.176396 * d, M = 134.963 + 13.064993 * d, F = 93.272 + 13.22935 * d;
  const lam = (L + 6.289 * Math.sin(M * r)) * r, bet = 5.128 * Math.sin(F * r) * r, e = 23.439 * r;
  const ra = Math.atan2(Math.sin(lam) * Math.cos(e) - Math.tan(bet) * Math.sin(e), Math.cos(lam)), dec = Math.asin(Math.sin(bet) * Math.cos(e) + Math.cos(bet) * Math.sin(e) * Math.sin(lam));
  return { ra: ((ra / r) + 360) % 360, dec: dec / r };
}
MODES.push({
  id: 'stars', page: 2, name: 'Stelle', label: 'Stars', kicker: 'Salone IV', icon: 'stars', sub: 'The sky above you right now, as a planisphere: the zenith in the centre and the horizon at the rim.',
  build(el) {
    el.innerHTML = `<div class="st-wrap"><canvas id="st-cv" aria-label="Star chart of the current sky"></canvas><div class="st-tip" id="st-tip"></div></div>
      <div class="st-ctl"><label class="lbl" style="margin:0">Time <b id="st-when">now</b></label><input type="range" id="st-off" min="-720" max="720" step="10" value="0" aria-label="Shift the sky in time"><button class="chip" id="st-now">Now</button></div>
      <div class="btn-row"><label class="chk"><input type="checkbox" id="st-lines" checked> Constellation lines</label><label class="chk"><input type="checkbox" id="st-names" checked> Names</label></div>
      <p class="fine" id="st-up"></p>
      <p class="fine">North is at the top and east is on the <em>left</em>, as when you lie on your back with your head to the north. It uses the location set in <em>Sole</em> (<span id="st-loc"></span>). It shows about 110 of the brightest stars and the Moon; planets are not shown.</p>`;
    this.off = 0; const cv = $('#st-cv', el);
    $('#st-off', el).oninput = (e) => { this.off = +e.target.value; this.draw(); };
    $('#st-now', el).onclick = () => { this.off = 0; $('#st-off').value = 0; this.draw(); };
    ['#st-lines', '#st-names'].forEach(s => $(s, el).onchange = () => this.draw());
    cv.addEventListener('pointermove', (e) => this.hover(e)); cv.addEventListener('pointerleave', () => $('#st-tip').classList.remove('show'));
    cv.addEventListener('pointerdown', (e) => this.hover(e));
  },
  show() { this.draw(); const L = Loc.get(); if (sunAltitude(L.lat, L.lon) < -6) Bus.emit('ach', 'stars'); },
  tick(now) { if (!this._t || now - this._t > 20000) { this._t = now; this.draw(); } },
  draw() {
    const cv = $('#st-cv'); if (!cv || !cv.clientWidth) return; const d = Math.min(devicePixelRatio || 1, 2), W = cv.clientWidth; if (cv.width !== Math.round(W * d)) cv.width = cv.height = Math.round(W * d);
    const x = cv.getContext('2d'); x.setTransform(d, 0, 0, d, 0, 0); x.clearRect(0, 0, W, W);
    const L = Loc.get(), when = new Date(Date.now() + this.off * 60000), ls = lst(when, L.lon), R = W * 0.46, cx = W / 2, cy = W / 2, sunA = sunAltitude(L.lat, L.lon, when);
    $('#st-when').textContent = this.off ? fmtClock(when) + (when.getDate() !== new Date().getDate() ? ' (' + when.toLocaleDateString('en-US', { weekday: 'short' }) + ')' : '') : 'now · ' + fmtClock(when); $('#st-loc').textContent = L.name;
    const P = (alt, az) => { const rr = R * (90 - alt) / 90, a = az * Math.PI / 180; return [cx - Math.sin(a) * rr, cy - Math.cos(a) * rr]; };
    // sky disc (brightens with twilight)
    const tw = clamp((sunA + 18) / 18, 0, 1), sky = x.createRadialGradient(cx, cy, 0, cx, cy, R);
    sky.addColorStop(0, mix('#070a1c', '#27406e', tw)); sky.addColorStop(1, mix('#101630', '#6a6f8e', tw)); x.fillStyle = sky; x.beginPath(); x.arc(cx, cy, R, 0, TAU); x.fill();
    x.save(); x.beginPath(); x.arc(cx, cy, R, 0, TAU); x.clip();
    x.strokeStyle = 'rgba(200,169,106,.12)'; x.lineWidth = 0.8; [30, 60].forEach(a => { x.beginPath(); x.arc(cx, cy, R * (90 - a) / 90, 0, TAU); x.stroke(); });
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx - Math.sin(a) * R, cy - Math.cos(a) * R); x.stroke(); }
    const pos = {}; this.vis = [];
    STARS.forEach(([n, ra, dec, mag]) => { const h = altAz(ra * 15, dec, L.lat, ls); pos[n] = h; if (h.alt > -1) { const [px, py] = P(h.alt, h.az); this.vis.push({ n, px, py, mag, alt: h.alt, az: h.az }); } });
    if ($('#st-lines').checked) { x.strokeStyle = 'rgba(200,169,106,.38)'; x.lineWidth = 0.9; const labels = [];
      Object.entries(CONST).forEach(([cn, segs]) => { let sx = 0, sy = 0, c = 0; segs.forEach(([a, b]) => { const A = pos[a], B = pos[b]; if (!A || !B || A.alt < 0 || B.alt < 0) return; const [x1, y1] = P(A.alt, A.az), [x2, y2] = P(B.alt, B.az); x.beginPath(); x.moveTo(x1, y1); x.lineTo(x2, y2); x.stroke(); sx += x1 + x2; sy += y1 + y2; c += 2; });
        if (c >= 4) labels.push([cn, sx / c, sy / c]); });
      if ($('#st-names').checked) { x.fillStyle = 'rgba(212,181,119,.6)'; x.font = 'italic 12px "Cormorant Garamond", serif'; x.textAlign = 'center'; labels.forEach(([n, lx, ly]) => x.fillText(n, lx, ly + 16)); } }
    this.vis.forEach(s => { const sz = clamp(3.4 - s.mag * 0.85, 0.7, 4.6); const g = x.createRadialGradient(s.px, s.py, 0, s.px, s.py, sz * 2.6); g.addColorStop(0, 'rgba(255,250,235,1)'); g.addColorStop(0.35, 'rgba(255,245,220,.75)'); g.addColorStop(1, 'rgba(255,245,220,0)'); x.fillStyle = g; x.beginPath(); x.arc(s.px, s.py, sz * 2.6, 0, TAU); x.fill(); });
    if ($('#st-names').checked) { x.fillStyle = 'rgba(236,228,210,.75)'; x.font = '11px "Cormorant Garamond", serif'; x.textAlign = 'left'; this.vis.filter(s => s.mag < 1.3 && s.alt > 3).forEach(s => x.fillText(s.n, s.px + 5, s.py - 4)); }
    // the moon
    const mr = moonRaDec(when), mh = altAz(mr.ra, mr.dec, L.lat, ls); if (mh.alt > -1) { const [px, py] = P(mh.alt, mh.az), mp = moonPhase(when); x.save(); x.shadowColor = 'rgba(255,240,200,.8)'; x.shadowBlur = 14; x.beginPath(); x.arc(px, py, 7, 0, TAU); x.fillStyle = 'rgba(243,230,194,.25)'; x.fill(); x.restore();
      x.fillStyle = '#2b2e3c'; x.beginPath(); x.arc(px, py, 7, 0, TAU); x.fill(); { const sgn = mp.waxing ? 1 : -1, k = Math.cos(mp.illum * Math.PI); x.fillStyle = '#f3e6c2'; x.beginPath(); x.arc(px, py, 7, -Math.PI / 2, Math.PI / 2, sgn < 0); x.ellipse(px, py, Math.abs(k) * 7, 7, 0, Math.PI / 2, -Math.PI / 2, (k > 0) === (sgn > 0)); x.fill(); }
      x.fillStyle = 'rgba(236,228,210,.8)'; x.font = 'italic 12px "Cormorant Garamond", serif'; x.fillText('Moon', px + 10, py + 4); this.vis.push({ n: 'The Moon · ' + mp.name, px, py, mag: -12, alt: mh.alt, az: mh.az }); }
    x.restore();
    // rim & cardinal points
    x.beginPath(); x.arc(cx, cy, R, 0, TAU); x.lineWidth = 2; x.strokeStyle = 'rgba(200,169,106,.55)'; x.stroke();
    x.fillStyle = '#d4b577'; x.font = '600 12px Cinzel, serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; [['N', 0], ['E', 90], ['S', 180], ['W', 270]].forEach(([s, az]) => { const a = az * Math.PI / 180; x.fillText(s, cx - Math.sin(a) * (R + 11), cy - Math.cos(a) * (R + 11)); }); x.textBaseline = 'alphabetic';
    const dir = (az) => ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'][Math.round(az / 45) % 8];
    const top = this.vis.filter(s => s.mag < 1.4 && s.alt > 10 && s.mag > -5).sort((p, q) => p.mag - q.mag).slice(0, 4);
    $('#st-up').innerHTML = sunA > -6 ? `The sun is ${sunA > 0 ? 'up' : 'just below the horizon'}, so most of these stars are washed out right now. Drag the time slider to tonight.` : top.length ? 'Brightest overhead: ' + top.map(s => `<em>${s.n}</em>, ${s.alt > 60 ? 'nearly overhead' : 'in the ' + dir(s.az)}`).join('; ') + '.' : '';
  },
  hover(e) {
    const cv = $('#st-cv'), r = cv.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top; let best = null, bd = 14;
    (this.vis || []).forEach(s => { const dd = Math.hypot(s.px - mx, s.py - my); if (dd < bd) { bd = dd; best = s; } });
    const t = $('#st-tip'); if (!best) { t.classList.remove('show'); return; }
    t.innerHTML = `<b>${best.n}</b><small>${best.mag > -5 ? 'magnitude ' + best.mag.toFixed(2) + ' · ' : ''}alt ${best.alt.toFixed(0)}°, az ${best.az.toFixed(0)}°</small>`; t.style.left = best.px + 'px'; t.style.top = best.py + 'px'; t.classList.add('show');
  }
});
