/* Lecter Watch — shared utilities. Cinco Corporation, Maison d'Horlogerie. */
'use strict';
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const pad = (n, l = 2) => String(Math.floor(Math.abs(n))).padStart(l, '0');
const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
const pick = (arr, rng = Math.random) => arr[Math.floor(rng() * arr.length)];

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function fmtDur(ms, cs = true) {
  ms = Math.max(0, ms);
  const h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60;
  const c = Math.floor(ms / 10) % 100;
  let out = (h ? h + ':' + pad(m) : pad(m)) + ':' + pad(s);
  if (cs) out += '.' + pad(c);
  return out;
}

const Store = {
  k: (k) => 'lecter.' + k,
  get(k, d) { try { const v = localStorage.getItem(this.k(k)); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(this.k(k), JSON.stringify(v)); } catch (e) { /* private mode */ } },
  del(k) { try { localStorage.removeItem(this.k(k)); } catch (e) {} }
};

const Bus = {
  h: {},
  on(ev, fn) { (this.h[ev] = this.h[ev] || []).push(fn); },
  emit(ev, ...a) { (this.h[ev] || []).forEach(fn => { try { fn(...a); } catch (e) { console.error(e); } }); }
};

const DEFAULTS = {
  theme: 'florence', h24: false, moths: true, mothCount: 26, fog: true, tick: false,
  hourlyChime: false, lightFollow: true, volume: 0.7, musicVol: 0.75, reducedMotion: false,
  seconds: 'sweep', mode: 'time', introSeen: false, nvNoise: true
};
const Settings = Object.assign({}, DEFAULTS, Store.get('settings', {}));
if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches && Store.get('settings', null) == null) Settings.reducedMotion = true;
function setSetting(k, v) { Settings[k] = v; Store.set('settings', Settings); Bus.emit('setting', k, v); Bus.emit('setting:' + k, v); }

let toastTimer;
function toast(msg, ms = 2400) {
  const el = $('#toast'); if (!el) return;
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), ms);
}

function el(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v; else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v);
  }
  kids.flat().forEach(c => e.append(c && c.nodeType ? c : document.createTextNode(c)));
  return e;
}

function fmtClock(d, h24 = Settings.h24, sec = false) {
  let h = d.getHours(); const m = d.getMinutes();
  if (h24) return pad(h) + ':' + pad(m) + (sec ? ':' + pad(d.getSeconds()) : '');
  const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12;
  return h + ':' + pad(m) + (sec ? ':' + pad(d.getSeconds()) : '') + ' ' + ap;
}

/* Time in a named zone -> {h,m,s,ms,day,dateStr,offsetMin} */
const _dtfCache = {};
function zoneTime(tz, now = new Date()) {
  if (!_dtfCache[tz]) _dtfCache[tz] = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'short', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const p = {}; _dtfCache[tz].formatToParts(now).forEach(x => p[x.type] = x.value);
  const h = +p.hour % 24, m = +p.minute, s = +p.second;
  const asUTC = Date.UTC(+p.year, ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].indexOf(p.month), +p.day, h, m, s);
  const offsetMin = Math.round((asUTC - (now.getTime() - now.getMilliseconds())) / 60000);
  return { h, m, s, ms: now.getMilliseconds(), weekday: p.weekday, dateStr: p.weekday + ' ' + p.month + ' ' + p.day, dayKey: +p.day, offsetMin };
}

/* Sun altitude (degrees) — NOAA-style low precision */
function sunAltitude(lat, lon, date = new Date()) {
  const rad = Math.PI / 180, d = date.getTime() / 86400000 - 10957.5; // days since J2000
  const g = (357.529 + 0.98560028 * d) * rad, q = 280.459 + 0.98564736 * d;
  const L = (q + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * rad, e = (23.439 - 0.00000036 * d) * rad;
  const dec = Math.asin(Math.sin(e) * Math.sin(L));
  const RA = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)) / rad;
  const GMST = (18.697374558 + 24.06570982441908 * d) % 24;
  const H = ((GMST * 15 + lon - RA) % 360) * rad;
  return Math.asin(Math.sin(lat * rad) * Math.sin(dec) + Math.cos(lat * rad) * Math.cos(dec) * Math.cos(H)) / rad;
}

/* Moon phase — Meeus, Astronomical Algorithms ch. 48 (low precision, ~0.1% illum). */
function moonPhase(date = new Date()) {
  const rad = Math.PI / 180;
  const jd = date.getTime() / 86400000 + 2440587.5, T = (jd - 2451545) / 36525;
  const n = (x) => ((x % 360) + 360) % 360;
  const D = n(297.8501921 + 445267.1114034 * T - 0.0018819 * T * T);
  const M = n(357.5291092 + 35999.0502909 * T - 0.0001536 * T * T);
  const Mp = n(134.9633964 + 477198.8675055 * T + 0.0087414 * T * T);
  const i = 180 - D - 6.289 * Math.sin(Mp * rad) + 2.100 * Math.sin(M * rad) - 1.274 * Math.sin((2 * D - Mp) * rad)
    - 0.658 * Math.sin(2 * D * rad) - 0.214 * Math.sin(2 * Mp * rad) - 0.110 * Math.sin(D * rad);
  const illum = (1 + Math.cos(i * rad)) / 2;
  // elongation-ish: use corrected phase angle to decide waxing
  const elong = n(180 - i);             // 0 new, 180 full
  const waxing = elong < 180;
  const frac = elong / 360;              // 0..1 cycle position
  const age = frac * 29.530588853;
  const names = ['New Moon','Waxing Crescent','First Quarter','Waxing Gibbous','Full Moon','Waning Gibbous','Last Quarter','Waning Crescent'];
  const name = names[Math.round(frac * 8) % 8];
  return { illum, waxing, frac, age, name, elong };
}
function nextMoonEvent(target /* 0 new, 0.5 full, .25 fq, .75 lq */, from = new Date()) {
  let t = from.getTime(), prev = moonPhase(new Date(t)).frac;
  const diff = (f) => ((f - target + 1.5) % 1) - 0.5;
  let pd = diff(prev);
  for (let k = 1; k < 24 * 32; k++) {
    const t2 = t + k * 3600000, f = moonPhase(new Date(t2)).frac, d = diff(f);
    if (pd < 0 && d >= 0) { // refine
      let a = t2 - 3600000, b = t2;
      for (let j = 0; j < 20; j++) { const m = (a + b) / 2; if (diff(moonPhase(new Date(m)).frac) < 0) a = m; else b = m; }
      return new Date((a + b) / 2);
    }
    pd = d;
  }
  return null;
}

function downloadDataURL(url, name) {
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
}
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
