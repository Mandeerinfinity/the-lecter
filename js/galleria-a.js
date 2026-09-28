/* Ring III · Galleria — I. Perpetual calendar · II. Second time zone · III. Power reserve & rate · IV. Letters · V. Harpsichord · VI. Winding */
'use strict';
Object.assign(DEFAULTS, { gmtZone: 'Europe/Rome', gmtOnDial: false, remindOnDial: true, tideOffset: 0, harpReg: '8+4' });
Object.keys(DEFAULTS).forEach(k => { if (!(k in Settings)) Settings[k] = DEFAULTS[k]; });
Object.assign(ICON, {
  calendar: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 9.5h16M8 3v4M16 3v4"/><circle cx="12" cy="14.5" r="2.2"/>',
  gmt: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c3 3 3 14 0 17M12 3.5c-3 3-3 14 0 17"/><path d="M12 12l4-5" stroke-width="1.8"/>',
  reserve: '<path d="M4.5 16a8 8 0 1 1 15 0"/><path d="M12 16l3.5-6"/><path d="M7 16h10"/>',
  letters: '<path d="M3.5 6.5h17v11h-17z"/><path d="M3.5 7l8.5 6.5L20.5 7"/><circle cx="12" cy="16.5" r="2"/>',
  harpsi: '<path d="M3 6h18v12H3z"/><path d="M7 6v7M11 6v7M15 6v7M19 6v7M5.5 6v4.5M9.5 6v4.5M13.5 6v4.5M17.5 6v4.5"/>',
  winding: '<path d="M8 8h8v8H8z"/><path d="M16 10h3v4h-3M9.5 8v8M12 8v8M14.5 8v8"/><path d="M4 7a8 8 0 0 0 0 10"/>',
  chess: '<path d="M8 21h8M9 18h6l1 3H8zM10 18c0-4-2-5-2-8a4 4 0 0 1 8 0c0 3-2 4-2 8"/><path d="M12 3v3M10.5 4.5h3"/>',
  library: '<path d="M4 4h4v16H4zM9 4h4v16H9z"/><path d="M14 5l3.8-1 3 15.4-3.8 1z"/>',
  florence: '<path d="M3 20h18M5 20v-5h14v5"/><path d="M7.5 15a4.5 4.5 0 0 1 9 0"/><path d="M12 10.5V8M11 8h2M12 8V6"/><path d="M19 15V7h1.5v8"/>',
  dates: '<path d="M12 20s-7-4.5-7-9.5A3.8 3.8 0 0 1 12 8a3.8 3.8 0 0 1 7 2.5c0 5-7 9.5-7 9.5z"/>',
  tides: '<path d="M3 15c2 0 2-2 4.5-2S10 15 12 15s2.5-2 4.5-2 2.5 2 4.5 2M3 19c2 0 2-2 4.5-2S10 19 12 19s2.5-2 4.5-2 2.5 2 4.5 2"/><circle cx="16" cy="6.5" r="3"/>',
  atelier: '<circle cx="9" cy="10" r="4.5"/><path d="M9 10l2-2"/><path d="M13 13l6 6M17 13l-4 4"/><path d="M15.5 4.5l4 4"/>'
});

/* size a canvas to its CSS box at the governor's DPR; returns a context in CSS pixels */
function gcv(cv, h) {
  const w = cv.clientWidth || 320, H = h || cv.clientHeight || w, d = Perf.dpr();
  if (cv.width !== Math.round(w * d) || cv.height !== Math.round(H * d)) { cv.width = Math.round(w * d); cv.height = Math.round(H * d); }
  const x = cv.getContext('2d'); x.setTransform(d, 0, 0, d, 0, 0); x.clearRect(0, 0, w, H); return { x, w, h: H };
}
const galIs = (id) => App.cur >= 0 && MODES[App.cur] && MODES[App.cur].id === id;
const ROMANS = (n) => { const v = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]; let s = ''; v.forEach(([a, r]) => { while (n >= a) { s += r; n -= a; } }); return s; };
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DOW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const isLeap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
const dim = (y, m) => new Date(y, m + 1, 0).getDate();
/* a dial face helper shared by the Galleria complications */
function galFace(x, cx, cy, R, T, opt = {}) {
  const g = x.createRadialGradient(cx - R * 0.3, cy - R * 0.4, R * 0.1, cx, cy, R);
  g.addColorStop(0, T.dial[0]); g.addColorStop(1, T.dial[1]); x.beginPath(); x.arc(cx, cy, R, 0, TAU); x.fillStyle = g; x.fill();
  const M = METALS[Settings.caseMetal && Settings.caseMetal !== 'auto' ? Settings.caseMetal : T.metal], rg = x.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
  rg.addColorStop(0, M[0]); rg.addColorStop(0.35, M[1]); rg.addColorStop(0.6, M[2]); rg.addColorStop(1, M[4]);
  x.lineWidth = R * (opt.ring || 0.06); x.strokeStyle = rg; x.beginPath(); x.arc(cx, cy, R + x.lineWidth / 2 - 0.5, 0, TAU); x.stroke();
  const sh = x.createLinearGradient(cx, cy - R, cx, cy + R); sh.addColorStop(0, 'rgba(255,255,255,.10)'); sh.addColorStop(0.5, 'rgba(255,255,255,0)'); x.fillStyle = sh; x.beginPath(); x.arc(cx, cy, R, 0, TAU); x.fill();
}
function galHand(x, cx, cy, a, len, w, col, tail = 0.18) {
  x.save(); x.translate(cx, cy); x.rotate(a); x.fillStyle = col; x.beginPath(); x.moveTo(-w, len * tail); x.lineTo(-w * 0.35, -len); x.lineTo(w * 0.35, -len); x.lineTo(w, len * tail); x.closePath();
  x.shadowColor = 'rgba(0,0,0,.4)'; x.shadowBlur = Perf.q.blur ? 3 : 0; x.shadowOffsetY = 1; x.fill(); x.restore();
}

/* ——— I. Perpetual calendar ——— */
MODES.push({
  id: 'calendar', page: 3, name: 'Calendario Perpetuo', label: 'Perpetual', kicker: 'Galleria I', icon: 'calendar', sub: 'Day, date, month and the four-year leap cycle, correct until the year 2100.',
  build(el) {
    el.innerHTML = `<canvas class="gal-cv" id="pc-cv" aria-label="Perpetual calendar dial"></canvas>
      <div class="pc-nav"><button class="arrow" id="pc-prev" aria-label="Previous month">‹</button><b id="pc-title"></b><button class="arrow" id="pc-next" aria-label="Next month">›</button><button class="chip" id="pc-today">Today</button></div>
      <div class="pc-grid" id="pc-grid" role="grid" aria-label="Month"></div>
      <p class="fine" id="pc-note"></p>`;
    this.view = new Date(); this.view.setDate(1); this.sel = new Date(); this.anim = null; this.disp = null;
    $('#pc-prev', el).onclick = () => this.shift(-1); $('#pc-next', el).onclick = () => this.shift(1);
    $('#pc-today', el).onclick = () => { this.view = new Date(); this.view.setDate(1); this.pick(new Date()); };
    $('#pc-grid', el).onclick = (e) => { const b = e.target.closest('button[data-d]'); if (b) this.pick(new Date(this.view.getFullYear(), this.view.getMonth(), +b.dataset.d)); };
  },
  shift(k) { this.view = new Date(this.view.getFullYear(), this.view.getMonth() + k, 1); const d = Math.min(this.sel.getDate(), dim(this.view.getFullYear(), this.view.getMonth())); this.pick(new Date(this.view.getFullYear(), this.view.getMonth(), d)); },
  pick(d) { this.sel = d; this.target = this.vals(d); if (!this.disp) this.disp = Object.assign({}, this.target); this.anim = performance.now(); this.grid(); this.draw(); },
  vals(d) { return { dow: d.getDay(), date: d.getDate(), month: d.getMonth(), leap: d.getFullYear() % 4, year: d.getFullYear() }; },
  grid() {
    const y = this.view.getFullYear(), m = this.view.getMonth(), n = dim(y, m), first = new Date(y, m, 1).getDay(), today = new Date(), sel = this.sel;
    $('#pc-title').textContent = `${MONTHS[m]} ${y}`;
    let h = ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(c => `<i>${c}</i>`).join(''); for (let i = 0; i < first; i++) h += '<span></span>';
    const marks = typeof Ricorrenze !== 'undefined' ? Ricorrenze.inMonth(y, m) : {};
    for (let d = 1; d <= n; d++) { const ph = moonPhase(new Date(y, m, d, 12)).frac, moon = Math.abs(ph - 0.5) < 0.017 ? '○' : (ph < 0.017 || ph > 0.983) ? '●' : '';
      const cls = [(today.getFullYear() === y && today.getMonth() === m && today.getDate() === d) ? 'today' : '', (sel.getFullYear() === y && sel.getMonth() === m && sel.getDate() === d) ? 'on' : '', marks[d] ? 'mark' : ''].join(' ');
      h += `<button data-d="${d}" class="${cls}" aria-label="${MONTHS[m]} ${d}${marks[d] ? ', ' + esc(marks[d]) : ''}">${d}${moon ? `<small>${moon}</small>` : ''}</button>`; }
    $('#pc-grid').innerHTML = h;
    const L = isLeap(y), next = [0, 1, 2, 3].map(k => y + k).find(isLeap) || y;
    $('#pc-note').innerHTML = `${y} is ${L ? '<b>a leap year</b>: the cam gives February its 29th day' : `year ${y % 4 === 0 ? '0' : y % 4} of the four-year cycle; the next leap year is ${next}`}. A mechanical perpetual calendar needs one visit to the watchmaker, on 1 March 2100, because 2100 skips its leap day. ● new moon, ○ full moon.`;
  },
  show() { if (!this.target) this.pick(this.sel); else { this.grid(); this.draw(); } },
  frame() { if (this.anim) this.draw(); },
  draw() {
    const cv = $('#pc-cv'); if (!cv || !cv.clientWidth) return; const { x, w } = gcv(cv), T = Watch.theme, cx = w / 2, cy = w / 2, R = w * 0.44;
    let u = this.anim ? clamp((performance.now() - this.anim) / 700, 0, 1) : 1; const e = 1 - Math.pow(1 - u, 3), D = this.disp, Tg = this.target;
    const cur = {}; ['dow', 'date', 'month', 'leap'].forEach(k => cur[k] = lerp(D[k], Tg[k], e)); if (u >= 1) { this.disp = Object.assign({}, Tg); this.anim = null; }
    galFace(x, cx, cy, R, T);
    const sub = (sx, sy, r, n, labels, val, col, small) => {
      x.save(); x.beginPath(); x.arc(sx, sy, r, 0, TAU); const g = x.createRadialGradient(sx, sy - r * 0.3, r * 0.2, sx, sy, r); g.addColorStop(0, T.sub[0]); g.addColorStop(1, T.sub[1]); x.fillStyle = g; x.fill();
      x.strokeStyle = T.printDim; x.lineWidth = 0.8; x.stroke(); x.fillStyle = T.print; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = `${small || r * 0.2}px Cinzel, Georgia, serif`;
      for (let i = 0; i < n; i++) { const a = i / n * TAU - Math.PI / 2; if (labels) { const lb = labels[i]; if (lb) x.fillText(lb, sx + Math.cos(a) * r * 0.74, sy + Math.sin(a) * r * 0.74); } else { x.fillRect(sx + Math.cos(a) * r * 0.86 - 0.5, sy + Math.sin(a) * r * 0.86 - 0.5, 1, 1); } }
      galHand(x, sx, sy, val / n * TAU, r * 0.62, r * 0.07, col); x.beginPath(); x.arc(sx, sy, r * 0.07, 0, TAU); x.fillStyle = col; x.fill(); x.restore();
    };
    sub(cx - R * 0.45, cy, R * 0.27, 7, ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'], cur.dow, T.hand[0], R * 0.05);
    sub(cx + R * 0.45, cy, R * 0.27, 12, ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'], cur.month, T.hand[0], R * 0.043);
    sub(cx, cy + R * 0.45, R * 0.2, 4, ['L', 'I', 'II', 'III'], cur.leap, T.accent, R * 0.06);
    x.save(); x.font = `${R * 0.036}px Cinzel, Georgia, serif`; x.fillStyle = T.printDim; x.textAlign = 'center'; x.fillText('ANNO BISESTILE', cx, cy + R * 0.71); x.restore();
    // the date: 31 numerals round the chapter, a long centre hand with a crescent tip
    x.save(); x.fillStyle = T.print; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = `${R * 0.07}px Georgia, serif`;
    for (let d = 1; d <= 31; d++) { const a = (d - 1) / 31 * TAU - Math.PI / 2; if (d % 2 || d === 30) x.fillText(String(d), cx + Math.cos(a) * R * 0.87, cy + Math.sin(a) * R * 0.87); else { x.beginPath(); x.arc(cx + Math.cos(a) * R * 0.87, cy + Math.sin(a) * R * 0.87, 1.3, 0, TAU); x.fill(); } }
    x.restore();
    // moon phase under the year window: lit half, then a terminator ellipse that either adds (gibbous) or removes (crescent) light
    const mp = moonPhase(this.sel).frac, my = cy - R * 0.3, mr = R * 0.1, lit = '#efe3bf', dark = '#16213f';
    x.save(); x.beginPath(); x.arc(cx, my, mr, 0, TAU); x.fillStyle = dark; x.fill(); x.clip(); const waxing = mp < 0.5, k = Math.cos(mp * TAU);
    x.fillStyle = lit; x.beginPath(); x.arc(cx, my, mr, -Math.PI / 2, Math.PI / 2, !waxing); x.closePath(); x.fill();
    x.fillStyle = k > 0 ? dark : lit; x.beginPath(); x.ellipse(cx, my, Math.abs(k) * mr + 0.01, mr, 0, 0, TAU); x.fill(); x.restore();
    x.beginPath(); x.arc(cx, my, mr, 0, TAU); x.strokeStyle = T.printDim; x.lineWidth = 0.8; x.stroke();
    galHand(x, cx, cy, (cur.date - 1) / 31 * TAU, R * 0.8, R * 0.016, T.accent, 0.1);
    const a = (cur.date - 1) / 31 * TAU - Math.PI / 2; x.beginPath(); x.arc(cx + Math.cos(a) * R * 0.74, cy + Math.sin(a) * R * 0.74, R * 0.026, 0, TAU); x.strokeStyle = T.accent; x.lineWidth = 1.6; x.stroke();
    x.save(); x.fillStyle = 'rgba(0,0,0,.35)'; roundRect(x, cx - R * 0.17, cy - R * 0.6, R * 0.34, R * 0.13, 3); x.fill(); x.strokeStyle = T.printDim; x.stroke();
    x.fillStyle = T.print; x.font = `600 ${R * 0.085}px Georgia, serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(this.target.year), cx, cy - R * 0.535); x.restore();
    x.save(); x.fillStyle = T.printDim; x.font = `${R * 0.034}px Cinzel, Georgia, serif`; x.textAlign = 'center'; x.fillText('CINCO · QUANTIÈME PERPÉTUEL', cx, cy - R * 0.14); x.restore();
    x.beginPath(); x.arc(cx, cy, R * 0.03, 0, TAU); x.fillStyle = T.accent; x.fill();
  }
});

/* ——— II. Second time zone (GMT) ——— */
const GMT_ZONES = [
  ['Europe/Rome', 'Florence', 43.77, 11.25], ['Europe/London', 'London', 51.5, -0.13], ['Europe/Paris', 'Paris', 48.86, 2.35], ['America/New_York', 'New York', 40.71, -74],
  ['America/Chicago', 'Chicago', 41.88, -87.63], ['America/Denver', 'Denver', 39.74, -104.99], ['America/Los_Angeles', 'Los Angeles', 34.05, -118.24], ['America/Sao_Paulo', 'São Paulo', -23.55, -46.63],
  ['Asia/Dubai', 'Dubai', 25.2, 55.27], ['Asia/Kolkata', 'Mumbai', 19.08, 72.88], ['Asia/Tokyo', 'Tokyo', 35.68, 139.69], ['Australia/Sydney', 'Sydney', -33.87, 151.21], ['UTC', 'UTC', 51.48, 0]
];
MODES.push({
  id: 'gmt', page: 3, name: 'Secondo Fuso', label: 'GMT', kicker: 'Galleria II', icon: 'gmt', sub: 'A second time zone on a 24-hour hand, for the traveller who keeps a home in Florence.',
  build(el) {
    el.innerHTML = `<canvas class="gal-cv" id="gm-cv" aria-label="24-hour GMT dial"></canvas>
      <label class="lbl" for="gm-zone">Second time zone</label><select id="gm-zone">${GMT_ZONES.map(z => `<option value="${z[0]}">${z[1]}</option>`).join('')}</select>
      <div class="set-list"><label class="row-set"><span>Show the red GMT hand on the main dial</span><label class="switch"><input type="checkbox" id="gm-dial"><span></span></label></label></div>
      <div class="gm-read" id="gm-read"></div>
      <p class="fine">The GMT hand turns once in 24 hours. On the main dial, read it against the small 24-hour track printed inside the minute ring. Day and night on this disc come from the real altitude of the sun over that city.</p>`;
    const s = $('#gm-zone', el); s.value = Settings.gmtZone; s.onchange = () => { setSetting('gmtZone', s.value); this.draw(); };
    const c = $('#gm-dial', el); c.checked = !!Settings.gmtOnDial; c.onchange = () => { setSetting('gmtOnDial', c.checked); Watch.build(); toast(c.checked ? 'GMT hand fitted to the main dial' : 'GMT hand removed'); };
  },
  show() { this.draw(); }, tick() { this.draw(); },
  draw() {
    const cv = $('#gm-cv'); if (!cv || !cv.clientWidth) return; const { x, w } = gcv(cv), T = Watch.theme, cx = w / 2, cy = w / 2, R = w * 0.44, now = new Date();
    const Z = GMT_ZONES.find(z => z[0] === Settings.gmtZone) || GMT_ZONES[0], zt = zoneTime(Z[0], now), here = { h: now.getHours(), m: now.getMinutes() };
    galFace(x, cx, cy, R, T);
    // day/night ring from the sun's altitude over the chosen city through its 24 hours
    const base = new Date(now); for (let i = 0; i < 96; i++) { const hh = i / 4, t = new Date(now.getTime() + ((hh - zt.h - zt.m / 60) * 3600000)), alt = sunAltitude(Z[2], Z[3], t);
      const a0 = hh / 24 * TAU - Math.PI / 2, a1 = (hh + 0.26) / 24 * TAU - Math.PI / 2; x.beginPath(); x.arc(cx, cy, R * 0.9, a0, a1); x.lineWidth = R * 0.12;
      x.strokeStyle = alt > 0 ? `rgba(233,200,120,${0.25 + Math.min(alt, 40) / 90})` : alt > -6 ? 'rgba(160,110,140,.45)' : 'rgba(20,30,70,.75)'; x.stroke(); }
    x.fillStyle = T.print; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = `${R * 0.075}px Georgia, serif`;
    for (let h = 0; h < 24; h++) { const a = h / 24 * TAU - Math.PI / 2; if (h % 2 === 0) x.fillText(String(h || 24), cx + Math.cos(a) * R * 0.72, cy + Math.sin(a) * R * 0.72); x.fillRect(cx + Math.cos(a) * R * 0.82 - 0.7, cy + Math.sin(a) * R * 0.82 - 0.7, 1.4, 1.4); }
    x.font = `${R * 0.06}px Georgia, serif`; x.fillStyle = T.printDim; x.fillText(Z[1].toUpperCase(), cx, cy - R * 0.3); x.fillText('HOME · ' + (Loc.get().name.split(',')[0] || 'HERE').toUpperCase(), cx, cy + R * 0.32);
    galHand(x, cx, cy, (here.h + here.m / 60) / 24 * TAU, R * 0.5, R * 0.035, T.hand[0]);
    const ga = (zt.h + zt.m / 60) / 24 * TAU; x.save(); x.translate(cx, cy); x.rotate(ga); x.strokeStyle = T.accent; x.lineWidth = 2; x.beginPath(); x.moveTo(0, R * 0.12); x.lineTo(0, -R * 0.66); x.stroke();
    x.fillStyle = T.accent; x.beginPath(); x.moveTo(0, -R * 0.8); x.lineTo(-R * 0.05, -R * 0.64); x.lineTo(R * 0.05, -R * 0.64); x.closePath(); x.fill(); x.restore();
    x.beginPath(); x.arc(cx, cy, R * 0.035, 0, TAU); x.fillStyle = T.accent; x.fill();
    const diff = zt.offsetMin - (-now.getTimezoneOffset()), dh = Math.trunc(diff / 60), dm = Math.abs(diff % 60);
    const rd = $('#gm-read'); if (rd) rd.innerHTML = `<div><small>${esc(Z[1])}</small><b class="mono">${pad(zt.h)}:${pad(zt.m)}</b><small>${zt.weekday}</small></div><div><small>Home</small><b class="mono">${pad(here.h)}:${pad(here.m)}</b><small>${diff === 0 ? 'same time' : `${diff > 0 ? '+' : '−'}${Math.abs(dh)}h${dm ? ' ' + dm + 'm' : ''}`}</small></div>`;
  }
});

/* ——— III. Power reserve & rate (a timegrapher) ——— */
MODES.push({
  id: 'reserve', page: 3, name: 'Riserva & Cronometria', label: 'Reserve', kicker: 'Galleria III', icon: 'reserve', sub: 'How much the mainspring holds, and how the movement is keeping time, as a watchmaker’s timegrapher sees it.',
  build(el) {
    el.innerHTML = `<canvas class="gal-cv short" id="rv-gauge" aria-label="Power reserve gauge"></canvas>
      <div class="stat-row" id="rv-stats"></div>
      <label class="lbl">Timegrapher · 28,800 vph</label><canvas class="tg-cv" id="rv-tg" aria-label="Timegrapher trace"></canvas>
      <div class="seg" id="rv-pos"><button data-p="DU">Dial up</button><button data-p="DD">Dial down</button><button data-p="CD">Crown down</button><button data-p="CU">Crown up</button></div>
      <div class="btn-row"><button class="btn primary" id="rv-wind">Hold to wind</button><button class="btn" data-act="flip">See the movement</button></div>
      <p class="fine">Rates are simulated from the reserve and the position, in the way a real calibre behaves: a little fast when fully wound, slower and with falling amplitude as the spring runs down. The chronometer standard is −4 to +6 seconds a day.</p>`;
    this.pos = 'DU'; this.trace = []; this.acc = 0; this.phase = 0;
    $$('#rv-pos button', el).forEach(b => b.onclick = () => { this.pos = b.dataset.p; this.mark(); });
    let hold = 0; const wb = $('#rv-wind', el), start = (e) => { e.preventDefault(); Snd.ensure(); clearInterval(hold); hold = setInterval(() => { CaseBack.wind(0.01); Watch.crownRot += 2; Snd.ratchet(0.45); if (Math.random() < 0.3) Haptics.tap('tick'); this.gauge(); }, 70); }, stop = () => clearInterval(hold);
    wb.addEventListener('pointerdown', start); ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => wb.addEventListener(ev, stop)); this.mark();
  },
  mark() { $$('#rv-pos button').forEach(b => b.classList.toggle('on', b.dataset.p === this.pos)); },
  model() {
    const p = CaseBack.power, posOff = { DU: 1.2, DD: 2.1, CD: -1.6, CU: 0.4 }[this.pos], amp = p > 0.01 ? 205 + 105 * Math.pow(p, 0.6) + (this.pos[0] === 'D' ? 12 : 0) : 0;
    const rate = p > 0.01 ? posOff + (p - 0.5) * 3.2 + (p < 0.15 ? -6 * (0.15 - p) / 0.15 : 0) : 0, be = 0.2 + (this.pos === 'CD' ? 0.2 : 0.05);
    return { p, amp, rate, be, hours: p * 42 };
  },
  show() { this.gauge(); this.trace = []; }, tick() { this.gauge(); },
  gauge() {
    const cv = $('#rv-gauge'); if (!cv || !cv.clientWidth) return; const { x, w, h } = gcv(cv), T = Watch.theme, m = this.model(), cx = w / 2, cy = h * 0.92, R = Math.min(w * 0.42, h * 0.8);
    x.lineCap = 'round'; x.lineWidth = R * 0.1; x.strokeStyle = 'rgba(255,255,255,.08)'; x.beginPath(); x.arc(cx, cy, R, Math.PI, 0); x.stroke();
    const g = x.createLinearGradient(cx - R, 0, cx + R, 0); g.addColorStop(0, '#8a1e1e'); g.addColorStop(0.25, T.accent); g.addColorStop(1, '#c8a96a');
    x.strokeStyle = g; x.beginPath(); x.arc(cx, cy, R, Math.PI, Math.PI + Math.PI * m.p); x.stroke();
    x.fillStyle = T.print || '#eee'; x.font = `${R * 0.1}px Georgia, serif`; x.textAlign = 'center';
    [0, 10, 20, 30, 42].forEach(v => { const a = Math.PI + Math.PI * v / 42; x.fillText(String(v), cx + Math.cos(a) * R * 0.78, cy + Math.sin(a) * R * 0.78 + R * 0.03); });
    x.font = `${R * 0.08}px Georgia, serif`; x.fillStyle = 'rgba(236,230,216,.6)'; x.fillText('RISERVA DI MARCIA · ORE', cx, cy - R * 0.28);
    galHand(x, cx, cy, -Math.PI / 2 + Math.PI * m.p, R * 0.9, R * 0.03, T.accent, 0.05);
    const sr = $('#rv-stats'); if (sr) { const hh = Math.floor(m.hours), mm = Math.floor((m.hours - hh) * 60), ok = m.rate >= -4 && m.rate <= 6;
      sr.innerHTML = `<div><b class="mono">${hh}h ${pad(mm)}m</b><small>reserve left</small></div><div><b class="mono">${m.rate >= 0 ? '+' : '−'}${Math.abs(m.rate).toFixed(1)}</b><small>s / day ${m.p > 0.01 ? (ok ? '· within COSC' : '· outside COSC') : ''}</small></div><div><b class="mono">${Math.round(m.amp)}°</b><small>amplitude</small></div><div><b class="mono">${m.be.toFixed(1)} ms</b><small>beat error</small></div>`; }
  },
  frame(dt) {
    this.acc += dt; if (this.acc < 1 / 30) return; const step = this.acc; this.acc = 0;
    const cv = $('#rv-tg'); if (!cv || !cv.clientWidth) return; const m = this.model(), W = cv.clientWidth, H = cv.clientHeight || 120;
    // each beat is a dot: vertical position = beat time error mod 1/8 s, which drifts in proportion to the rate
    this.bAcc = (this.bAcc || 0) + step * 8; const beats = Math.floor(this.bAcc); this.bAcc -= beats; for (let i = 0; i < beats; i++) { this.phase += m.rate / 86400 * 1000 / 8 * 30; const tock = this.trace.length % 2; const y = ((this.phase + (tock ? m.be : 0) + (Math.random() - 0.5) * 0.08) % 6 + 6) % 6; this.trace.push(m.p > 0.01 ? y : null); }
    const max = Math.floor(W / 2); if (this.trace.length > max) this.trace.splice(0, this.trace.length - max);
    const { x } = gcv(cv, H); x.fillStyle = '#0b0f0c'; x.fillRect(0, 0, W, H); x.strokeStyle = 'rgba(120,255,160,.08)'; x.lineWidth = 1;
    for (let k = 1; k < 6; k++) { x.beginPath(); x.moveTo(0, k * H / 6); x.lineTo(W, k * H / 6); x.stroke(); }
    x.fillStyle = '#7dffa0'; this.trace.forEach((y, i) => { if (y == null) return; x.fillRect(i * 2, y / 6 * H, 1.6, 1.6); });
    x.fillStyle = 'rgba(125,255,160,.7)'; x.font = '11px ui-monospace, Menlo, monospace'; x.fillText(`${m.rate >= 0 ? '+' : '−'}${Math.abs(m.rate).toFixed(1)} s/d   ${Math.round(m.amp)}°   ${m.be.toFixed(1)} ms   ${this.pos}`, 8, H - 8);
  }
});

/* ——— IV. Letters from the Doctor: one original aphorism a day ——— */
const LETTERS = [
  'Punctuality is a courtesy one extends to time itself, and time, in return, remembers.', 'Taste is memory with good posture.', 'A well-laid table is an argument that never needs to raise its voice.',
  'Curiosity is the only appetite that grows more refined the more it is indulged.', 'Never hurry a sauce, a letter, or a first impression.', 'Manners are the architecture of a quiet mind.',
  'One learns a great deal about a person from what they do with a silence.', 'A good watch does not tell you the time. It reminds you that you are spending it.', 'Florence teaches that beauty is patience made visible.',
  'Keep your curiosity sharp and your cuffs sharper.', 'The palate, like the mind, likes to be surprised by something it was quietly expecting.', 'Every drawer in a memory palace should close without a sound.',
  'Courtesy costs nothing and purchases almost everything.', 'Discretion is knowing which truths to serve and which to leave in the cellar to mature.', 'A harpsichord cannot sustain a note, and so it teaches us to say a thing beautifully once.',
  'The mind is a room. Furnish it as though a guest of taste might call.', 'A question asked gently travels further than an answer shouted.', 'Order is not the enemy of passion. It is the vase in which passion is arranged.',
  'Choose companions as you choose a wine: for what they will become.', 'Observe first. Opinions are cheaper when bought after the facts.', 'The most elegant lock is the one nobody notices.',
  'Beauty is rarely loud. It is simply impossible to ignore once seen.', 'A pen that writes slowly tends to write things worth reading.', 'To be well read is to own more rooms than any house can hold.',
  'Time kept carefully keeps you in return.', 'Good taste is, in the end, a refusal to be careless.', 'There is no idle mind, only an unsupervised one.',
  'Some doors open with a key and others with a question. Carry both.', 'Moths are drawn to light and people to certainty. Both are sometimes mistaken.', 'Cultivate one extravagance and a thousand small economies.',
  'The finest instrument is attention, and it stays in tune if you practise.', 'A quiet table after a good meal is the highest compliment to the cook.', 'The escapement lets time go one beat at a time. Opinions deserve the same restraint.',
  'Forgetting is only a room in the palace whose door you have misplaced.', 'Rudeness is a draught in the house of the mind. Close the window, politely.', 'Say less than you know, and know more than you say.',
  'Elegance is the removal of everything that does not belong.', 'A candle asks for so little and gives a room its secrets.', 'Collect small perfections: a crisp page, a true note, a well-set stone.',
  'The best conversations, like the best watches, have more going on beneath the dial.', 'Handwriting is a portrait the hand paints without permission.', 'Be generous with praise and exact with it. Vague praise is only noise.',
  'Learn one poem by heart each season, and you will never walk alone in the dark.', 'A true connoisseur is simply someone who has paid attention for a very long time.', 'Keep a notebook. The memory is a gracious host but an unreliable archivist.',
  'The world is loud because so few have learned to listen well.', 'An old recipe is a letter from someone who wanted you to eat well.', 'Wind your watch in the morning and your resolve at night.'
];
MODES.push({
  id: 'letters', page: 3, name: 'Lettere dal Dottore', label: 'Letters', kicker: 'Galleria IV', icon: 'letters', sub: 'A short note arrives every day at midnight. Earlier letters are kept in the drawer.',
  build(el) {
    el.innerHTML = `<article class="letter" id="lt-card" aria-live="polite"></article>
      <div class="btn-row"><button class="btn" id="lt-prev">‹ Earlier</button><button class="btn" id="lt-next">Later ›</button><button class="btn" id="lt-copy">Copy</button><button class="btn" id="lt-say">Read aloud</button></div>
      <p class="fine">All letters are original to this watch. A new one is chosen for each date, so every owner receives the same letter on the same day.</p>`;
    this.off = 0; $('#lt-prev', el).onclick = () => { this.off--; this.render(); }; $('#lt-next', el).onclick = () => { if (this.off < 0) { this.off++; this.render(); } };
    $('#lt-copy', el).onclick = () => { const t = this.text(); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast('Copied to the clipboard')).catch(() => toast('Copy is not available here')); };
    $('#lt-say', el).onclick = () => { Voice.pick(); if (!Voice.speak(LETTERS[this.idx()], true)) toast('Speech is not available in this browser'); };
  },
  date() { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + this.off); return d; },
  idx() { const d = this.date(), n = Math.floor(d.getTime() / 86400000); const r = mulberry32(n * 2654435761 >>> 0); return (n * 17 + Math.floor(r() * 7)) % LETTERS.length; },
  text() { return `${LETTERS[this.idx()]} — Il Dottore, ${this.date().toDateString()}`; },
  render() {
    const d = this.date(), c = $('#lt-card'); if (!c) return; const nth = Math.floor(d.getTime() / 86400000) % 1000;
    c.innerHTML = `<header><span class="lt-date">${d.getDate()} · ${ROMANS(d.getMonth() + 1)} · ${ROMANS(d.getFullYear())}</span><span class="lt-no">No. ${nth}</span></header>
      <p class="lt-greet">My dear friend,</p><p class="lt-body">${esc(LETTERS[this.idx()])}</p><p class="lt-sign">With the utmost courtesy,<br><em>Il Dottore</em></p><div class="lt-seal" aria-hidden="true">C</div>`;
    $('#lt-next').disabled = this.off >= 0; c.classList.remove('in'); void c.offsetWidth; c.classList.add('in');
  },
  show() { this.render(); if (this.off === 0) Store.set('letterSeen', new Date().toDateString()); }
});

/* ——— V. The playable harpsichord, with a recorder ——— */
const HARP_KEYS = { z: 48, s: 49, x: 50, d: 51, c: 52, v: 53, g: 54, b: 55, h: 56, n: 57, j: 58, m: 59, ',': 60, q: 60, 2: 61, w: 62, 3: 63, e: 64, r: 65, 5: 66, t: 67, 6: 68, y: 69, 7: 70, u: 71, i: 72 };
MODES.push({
  id: 'harpsi', page: 3, name: 'Clavicembalo', label: 'Harpsichord', kicker: 'Galleria V', icon: 'harpsi', sub: 'Two octaves of the house harpsichord. Play with a finger, a mouse, or the computer keyboard, and record what you play.',
  build(el) {
    const keys = []; for (let n = 48; n <= 72; n++) keys.push(n); const black = (n) => [1, 3, 6, 8, 10].includes(n % 12);
    const whites = keys.filter(n => !black(n)), ww = 100 / whites.length; let wi = 0, h = '';
    keys.forEach(n => { if (!black(n)) { h += `<button class="hk w" data-n="${n}" style="left:${wi * ww}%;width:${ww}%" aria-label="${this.noteName(n)}"><i>${n % 12 === 0 ? 'C' + (n / 12 - 1) : ''}</i></button>`; wi++; } else h += `<button class="hk b" data-n="${n}" style="left:${wi * ww - ww * 0.3}%;width:${ww * 0.6}%" aria-label="${this.noteName(n)}"></button>`; });
    el.innerHTML = `<div class="harp-case"><div class="harp-lid" aria-hidden="true"><span>CINCO · FLORENTIA</span></div><div class="harp-keys" id="hp-keys">${h}</div></div>
      <label class="lbl">Registration</label><div class="seg" id="hp-reg"><button data-v="8">One 8′ choir</button><button data-v="8+8">Two 8′</button><button data-v="8+4">8′ + 4′</button><button data-v="lute">Lute stop</button></div>
      <div class="btn-row"><button class="btn" id="hp-rec">● Record</button><button class="btn" id="hp-play">▶ Play back</button><button class="btn ghost" id="hp-clear">Clear</button><button class="btn" id="hp-demo">A little minuet</button></div>
      <p class="fine" id="hp-info"></p>
      <p class="fine">Keyboard: <kbd>Z</kbd>–<kbd>M</kbd> with <kbd>S D G H J</kbd> for the lower octave, <kbd>Q</kbd>–<kbd>I</kbd> with <kbd>2 3 5 6 7</kbd> for the upper. While this page is open those letters play notes instead of their usual shortcuts; the arrow keys and <kbd>Esc</kbd> still work.</p>`;
    this.rec = Store.get('harpRec', null); this.recording = null; this.down = new Map();
    const K = $('#hp-keys', el); let dragging = false;
    const hit = (e) => { const t = document.elementFromPoint(e.clientX, e.clientY); return t && t.closest ? t.closest('.hk') : null; };
    K.addEventListener('pointerdown', (e) => { e.preventDefault(); Snd.ensure(); dragging = true; K.setPointerCapture(e.pointerId); const k = hit(e); if (k) this.press(+k.dataset.n, k); this._lk = k; });
    K.addEventListener('pointermove', (e) => { if (!dragging) return; const k = hit(e); if (k && k !== this._lk) { this.press(+k.dataset.n, k); this._lk = k; } });
    const up = () => { dragging = false; this._lk = null; }; K.addEventListener('pointerup', up); K.addEventListener('pointercancel', up);
    $$('#hp-reg button', el).forEach(b => b.onclick = () => { setSetting('harpReg', b.dataset.v); this.mark(); });
    $('#hp-rec', el).onclick = () => this.toggleRec(); $('#hp-play', el).onclick = () => this.playback(this.rec); $('#hp-clear', el).onclick = () => { this.rec = null; Store.set('harpRec', null); this.info(); toast('Recording cleared'); };
    $('#hp-demo', el).onclick = () => this.playback({ notes: this.minuet() }); this.mark(); this.info();
  },
  noteName(n) { return ['C', 'C sharp', 'D', 'E flat', 'E', 'F', 'F sharp', 'G', 'A flat', 'A', 'B flat', 'B'][n % 12] + ' ' + (Math.floor(n / 12) - 1); },
  mark() { $$('#hp-reg button').forEach(b => b.classList.toggle('on', b.dataset.v === Settings.harpReg)); },
  info() { const i = $('#hp-info'); if (!i) return; const r = this.rec; i.textContent = this.recording ? 'Recording… play, then press Stop.' : r && r.notes.length ? `Saved recording: ${r.notes.length} notes, ${(r.dur / 1000).toFixed(1)} s. It stays in this browser.` : 'Nothing recorded yet.'; const b = $('#hp-rec'); if (b) b.textContent = this.recording ? '■ Stop' : '● Record'; },
  press(n, keyEl, vel = 0.75, silent) {
    const reg = Settings.harpReg, t = 0;
    Snd.pluck(n, t, vel * (reg === '8' ? 1 : 0.8), reg === 'lute' ? 0.35 : 0, null);
    if (reg === '8+8') Snd.pluck(n, (Snd.ctx ? Snd.ctx.currentTime : 0) + 0.012, vel * 0.55, 0, null);
    if (reg === '8+4' && n + 12 <= 96) Snd.pluck(n + 12, (Snd.ctx ? Snd.ctx.currentTime : 0) + 0.006, vel * 0.38, 0, null);
    const k = keyEl || $(`.hk[data-n="${n}"]`); if (k) { k.classList.remove('dn'); void k.offsetWidth; k.classList.add('dn'); clearTimeout(k._t); k._t = setTimeout(() => k.classList.remove('dn'), 180); }
    if (this.recording && !silent) this.recording.notes.push([Math.round(performance.now() - this.recording.t0), n]);
    if (!silent) { Haptics.tap('tick'); Bus.emit('ach', 'harpsichordist'); }
  },
  toggleRec() {
    if (this.recording) { const r = this.recording; r.dur = performance.now() - r.t0; this.recording = null; if (r.notes.length) { this.rec = r; Store.set('harpRec', r); toast(`Recorded ${r.notes.length} notes`); } else toast('Nothing was played'); }
    else { this.stopPlay(); Snd.ensure(); this.recording = { t0: performance.now(), notes: [] }; toast('Recording: play whenever you are ready'); }
    this.info();
  },
  stopPlay() { (this.timers || []).forEach(clearTimeout); this.timers = []; },
  playback(r) { if (!r || !r.notes || !r.notes.length) { toast('Record something first'); return; } this.stopPlay(); Snd.ensure(); const off = r.notes[0][0]; r.notes.forEach(([t, n]) => this.timers.push(setTimeout(() => this.press(n, null, 0.7, true), t - off + 60))); },
  // an original little minuet in G, in the galant style (bass notes on the downbeats)
  minuet() {
    const q = 420, mel = [67, 60, 62, 64, 66, 67, 60, 60, 69, 64, 66, 67, 69, 71, 72, 67, 60, 60, 64, 65, 64, 62, 60, 62, 64, 62, 60, 59, 57, 59, 60, 55];
    const bass = [55, 48, 53, 52, 48, 53, 55, 48], out = []; let t = 0;
    mel.forEach((n, i) => { out.push([t, Math.min(72, n)]); if (i % 4 === 0) out.push([t, bass[(i / 4) % bass.length]]); t += q * (i % 4 === 3 ? 1.5 : i % 4 === 0 ? 0.75 : 0.875); });
    return out;
  },
  key(e) { if (e.repeat) return !!HARP_KEYS[e.key.toLowerCase()]; const n = HARP_KEYS[e.key.toLowerCase()]; if (n == null || e.shiftKey) return false; Snd.ensure(); this.press(n); return true; },
  hide() { this.stopPlay(); if (this.recording) this.toggleRec(); }
});

/* ——— VI. The winding game ——— */
MODES.push({
  id: 'winding', page: 3, name: 'La Carica', label: 'Winding', kicker: 'Galleria VI', icon: 'winding', sub: 'Wind the mainspring from empty to full by turning the crown. Steady hands score best.',
  build(el) {
    el.innerHTML = `<canvas class="gal-cv" id="wd-cv" aria-label="The crown and the mainspring barrel. Drag up or down on it to wind."></canvas>
      <div class="stat-row" id="wd-stats"></div>
      <div class="btn-row"><button class="btn primary" id="wd-go">Let it run down and start</button></div>
      <p class="fine">Drag up and down across the crown (or use the mouse wheel, or the <kbd>↑</kbd> key) to turn it. Each click is one tooth of the ratchet. About forty full turns fill the barrel. Your score rewards speed and an even rhythm. The slipping bridle means you cannot overwind it.</p>`;
    this.game = null; this.rot = 0; this.best = Store.get('windBest', null); this.spring = 0; this.acc = 0;
    const cv = $('#wd-cv', el); let last = null;
    cv.addEventListener('pointerdown', (e) => { e.preventDefault(); Snd.ensure(); cv.setPointerCapture(e.pointerId); last = e.clientY; });
    cv.addEventListener('pointermove', (e) => { if (last == null) return; const dy = last - e.clientY; if (Math.abs(dy) >= 2) { this.turn(Math.abs(dy) * 1.6); last = e.clientY; } });
    const up = () => { last = null; }; cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', (e) => { e.preventDefault(); e.stopPropagation(); Snd.ensure(); this.turn(Math.min(40, Math.abs(e.deltaY) * 0.5)); }, { passive: false });
    $('#wd-go', el).onclick = () => this.start(); this.stats();
  },
  start() { this.game = { t0: 0, clicks: [], done: false }; this.spring = 0; this.rot = 0; toast('The barrel is empty. Turn the crown.'); this.stats(); this.draw(); },
  turn(deg) {
    const before = Math.floor(this.rot / 15); this.rot += deg; const clicks = Math.floor(this.rot / 15) - before; if (clicks <= 0) { this.draw(); return; }
    const g = this.game, now = performance.now();
    for (let i = 0; i < Math.min(clicks, 4); i++) { Snd.ratchet(0.35 + Math.min(0.4, this.spring * 0.4)); }
    if (Math.random() < 0.5) Haptics.tap('tick');
    if (g && !g.done) { if (!g.t0) g.t0 = now; g.clicks.push(now); this.spring = clamp(this.spring + clicks / 960, 0, 1); if (this.spring >= 1) this.finish(); }
    else { this.spring = clamp(this.spring + clicks / 960, 0, 1); CaseBack.wind(clicks / 960); }
    Watch.crownRot += clicks * 3; this.stats(); this.draw();
  },
  finish() {
    const g = this.game; g.done = true; const secs = (performance.now() - g.t0) / 1000, iv = []; for (let i = 1; i < g.clicks.length; i++) iv.push(g.clicks[i] - g.clicks[i - 1]);
    const mean = iv.reduce((a, b) => a + b, 0) / (iv.length || 1), sd = Math.sqrt(iv.reduce((a, b) => a + (b - mean) ** 2, 0) / (iv.length || 1)), even = clamp(1 - sd / (mean * 2.5 || 1), 0, 1);
    const score = Math.round(1000 * clamp(25 / Math.max(secs, 1), 0.2, 1.5) * (0.5 + even * 0.5)); g.score = score; g.secs = secs; g.even = even;
    CaseBack.power = 1; CaseBack.wind(0); Snd.chime(1); Haptics.tap('success');
    if (!this.best || score > this.best.score) { this.best = { score, secs, date: new Date().toDateString() }; Store.set('windBest', this.best); toast(`Fully wound. A new best: ${score}`); } else toast(`Fully wound. Score ${score}`);
    Bus.emit('ach', 'wound'); this.stats();
  },
  stats() {
    const s = $('#wd-stats'); if (!s) return; const g = this.game, secs = g && g.t0 ? ((g.done ? g.secs * 1000 : performance.now() - g.t0) / 1000) : 0;
    s.innerHTML = `<div><b class="mono">${Math.round(this.spring * 100)}%</b><small>mainspring</small></div><div><b class="mono">${secs.toFixed(1)} s</b><small>time</small></div><div><b class="mono">${g && g.done ? g.score : '—'}</b><small>score${g && g.done ? ` · evenness ${Math.round(g.even * 100)}%` : ''}</small></div><div><b class="mono">${this.best ? this.best.score : '—'}</b><small>your best</small></div>`;
  },
  show() { if (!this.game) this.spring = CaseBack.power; this.draw(); this.stats(); },
  key(e) { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { Snd.ensure(); this.turn(30); return true; } return false; },
  frame(dt) { const g = this.game; if (g && g.t0 && !g.done) { this.acc += dt; if (this.acc > 0.1) { this.acc = 0; this.stats(); } } },
  draw() {
    const cv = $('#wd-cv'); if (!cv || !cv.clientWidth) return; const { x, w } = gcv(cv), h = w, T = Watch.theme, M = METALS[Settings.caseMetal && Settings.caseMetal !== 'auto' ? Settings.caseMetal : T.metal];
    // the barrel, open, with the mainspring coiling tighter round the arbor as it is wound
    const bx = w * 0.38, by = h * 0.5, BR = w * 0.3, s = this.spring;
    const bg = x.createRadialGradient(bx - BR * 0.3, by - BR * 0.3, BR * 0.1, bx, by, BR); bg.addColorStop(0, M[1]); bg.addColorStop(0.7, M[2]); bg.addColorStop(1, M[4]);
    x.beginPath(); x.arc(bx, by, BR, 0, TAU); x.fillStyle = bg; x.fill(); x.beginPath(); x.arc(bx, by, BR * 0.9, 0, TAU); x.fillStyle = '#15130f'; x.fill();
    const turns = 9, inner = BR * 0.16, outer = BR * (0.86 - s * 0.42), rot = this.rot * 0.02;
    x.strokeStyle = '#6f7c8a'; x.lineWidth = Math.max(1.2, BR * 0.022); x.beginPath();
    for (let i = 0; i <= turns * 60; i++) { const u = i / (turns * 60), a = u * turns * TAU + rot, r = inner + (outer - inner) * Math.pow(u, 0.9 - s * 0.35); const px = bx + Math.cos(a) * r, py = by + Math.sin(a) * r; i ? x.lineTo(px, py) : x.moveTo(px, py); }
    x.stroke(); x.strokeStyle = 'rgba(210,225,240,.35)'; x.lineWidth = 0.8; x.stroke();
    // loose outer coils when unwound lie against the barrel wall
    if (s < 0.95) { x.strokeStyle = '#5d6874'; x.lineWidth = BR * 0.02; for (let k = 0; k < Math.round((1 - s) * 5); k++) { x.beginPath(); x.arc(bx, by, BR * (0.86 - k * 0.035), 0, TAU); x.stroke(); } }
    x.beginPath(); x.arc(bx, by, inner * 0.9, 0, TAU); const ag = x.createRadialGradient(bx, by, 1, bx, by, inner); ag.addColorStop(0, M[0]); ag.addColorStop(1, M[3]); x.fillStyle = ag; x.fill();
    x.save(); x.translate(bx, by); x.rotate(rot); x.fillStyle = '#1a1712'; x.fillRect(-inner * 0.5, -inner * 0.12, inner, inner * 0.24); x.restore();
    // ratchet wheel teeth on the rim
    x.save(); x.translate(bx, by); x.rotate(rot); x.fillStyle = M[2]; for (let k = 0; k < 48; k++) { x.rotate(TAU / 48); x.beginPath(); x.moveTo(BR * 0.98, -2); x.lineTo(BR * 1.05, 0); x.lineTo(BR * 0.98, 2); x.fill(); } x.restore();
    // the crown, seen from the side: a knurled cylinder whose grooves travel as it turns
    const cx0 = w * 0.74, cw = w * 0.16, ch = w * 0.42, cy0 = by - ch / 2, cg = x.createLinearGradient(cx0, 0, cx0 + cw, 0);
    cg.addColorStop(0, M[4]); cg.addColorStop(0.3, M[1]); cg.addColorStop(0.55, M[0]); cg.addColorStop(1, M[3]); x.fillStyle = cg; roundRect(x, cx0, cy0, cw, ch, cw * 0.2); x.fill();
    x.save(); roundRect(x, cx0, cy0, cw, ch, cw * 0.2); x.clip(); x.strokeStyle = 'rgba(0,0,0,.35)'; x.lineWidth = 1.2; const stp = ch / 18, off = (this.rot * 0.3) % stp;
    for (let y = cy0 - stp + off; y < cy0 + ch + stp; y += stp) { x.beginPath(); x.moveTo(cx0, y); x.lineTo(cx0 + cw, y); x.stroke(); } x.restore();
    x.fillStyle = M[2]; x.fillRect(cx0 - w * 0.06, by - w * 0.03, w * 0.06, w * 0.06);
    x.fillStyle = T.print || '#eee'; x.font = `${w * 0.035}px Georgia, serif`; x.textAlign = 'center'; x.fillText('↕ turn', cx0 + cw / 2, cy0 + ch + w * 0.06);
    x.fillText(`${Math.round(s * 42)} h`, bx, by + BR + w * 0.07);
  }
});
