/* v2 core: voice, achievements, location & solar events, straps & product shots, nightstand. */
'use strict';
Object.assign(DEFAULTS, { voice: false, voiceQuid: true, caseMetal: 'auto', strap: 'calf', engrave: null, tourbillonDial: false, lumeGlow: true, idleMins: 0, nightDim: 0.7, nightStyle: 'analog', unlockPalace: false, ring: 1 });
Object.keys(DEFAULTS).forEach(k => { if (!(k in Settings)) Settings[k] = DEFAULTS[k]; }); delete Settings._engravePreview;

/* ——— Voice (speechSynthesis, British if the system has one) ——— */
const Voice = {
  ok: typeof window.speechSynthesis !== 'undefined' && typeof window.SpeechSynthesisUtterance !== 'undefined', v: null,
  pick() {
    if (!this.ok) return null; const vs = speechSynthesis.getVoices() || []; if (!vs.length) return null;
    const gb = vs.filter(v => /en[-_]GB/i.test(v.lang)); const male = /Daniel|Arthur|Oliver|George|Ryan|Thomas|Brian|Male|Harry|Malcolm/i;
    this.v = gb.find(v => male.test(v.name)) || gb[0] || vs.find(v => /^en/i.test(v.lang)) || null; return this.v;
  },
  name() { const v = this.v || this.pick(); return v ? v.name + ' (' + v.lang + ')' : (this.ok ? 'system default voice' : 'unavailable'); },
  speak(text, force) {
    if (!this.ok) { if (force) toast('Speech is not available in this browser'); return false; }
    if (!Settings.voice && !force) return false;
    try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); const v = this.v || this.pick(); if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'en-GB'; u.rate = 0.9; u.pitch = 0.82; u.volume = clamp(Settings.volume + 0.2, 0, 1); speechSynthesis.speak(u); return true; } catch (e) { return false; }
  },
  words(n) { const W = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'a quarter', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty']; if (n <= 20) return W[n]; if (n === 30) return 'half'; return 'twenty-' + W[n - 20]; },
  phrase(d = new Date()) {
    const h = d.getHours(), m = d.getMinutes(), part = h < 5 ? 'at night' : h < 12 ? 'in the morning' : h < 17 ? 'in the afternoon' : h < 21 ? 'in the evening' : 'at night';
    const hr = (x) => { x = x % 12; return x === 0 ? 'twelve' : this.words(x); };
    if (m === 0) return `It is ${h === 0 ? 'midnight' : h === 12 ? 'noon' : hr(h) + " o'clock " + part}.`;
    if (m <= 30) return `It is ${m === 15 ? 'a quarter' : m === 30 ? 'half' : this.words(m) + (m === 1 ? ' minute' : ' minutes')} past ${hr(h)} ${part}.`;
    const to = 60 - m, nh = (h + 1) % 24; return `It is ${to === 15 ? 'a quarter' : this.words(to) + (to === 1 ? ' minute' : ' minutes')} to ${nh === 0 ? 'midnight' : nh === 12 ? 'noon' : hr(nh) + ' ' + (nh < 5 ? 'at night' : nh < 12 ? 'in the morning' : nh < 17 ? 'in the afternoon' : nh < 21 ? 'in the evening' : 'at night')}.`;
  },
  sayTime(force) { const p = this.phrase(); if (!this.speak(p, force !== false)) toast(p, 3200); else toast(p, 3200); }
};
if (Voice.ok) { try { speechSynthesis.onvoiceschanged = () => Voice.pick(); Voice.pick(); } catch (e) {} }

/* ——— Achievements & secrets ——— */
const ACH = [
  ['welcome', 'Good evening', 'Opened the watch for the first time.', 'Simply arrive.'],
  ['grand', 'Grand tour', 'Visited every complication on both rings.', 'Leave no room of the palace unvisited.'],
  ['konami', 'Moth storm', 'Entered the old code: ↑ ↑ ↓ ↓ ← → ← → B A.', 'An old code, known to players of a certain age.'],
  ['palace', 'The Memory Palace', 'Revealed the hidden lapis dial.', 'The crown rewards persistence. Five quick turns.'],
  ['flip', 'Open book', 'Turned the watch over to see the movement.', 'Some beauty is kept on the back.'],
  ['wound', 'Fully wound', 'Filled the power reserve to 100%.', 'Spin the rotor. Turn the crown.'],
  ['lap10', 'Exactly ten', 'Recorded a lap of 10.00 s, within five hundredths.', 'Ten seconds. Not nine point nine.'],
  ['host', 'Host of the season', 'Composed five menus.', 'Entertain, repeatedly.'],
  ['sketch', 'Florentine hand', 'Saved a charcoal sketch.', 'Draw, then keep it.'],
  ['candour', 'Transparent', 'Scored 100% candour in the interrogation.', 'Answer honestly.'],
  ['quid', 'Fair trade', 'Completed five exchanges of quid pro quo.', 'An answer for an answer, five times.'],
  ['hour', 'On the hour', 'Struck the minute repeater at the top of the hour.', 'Ask for the time when there are no minutes to tell.'],
  ['night', 'Night owl', 'Consulted the watch between midnight and one.', 'Keep late hours.'],
  ['fullmoon', 'Under a full moon', 'Visited while the moon was more than 97% lit.', 'Wait for the sky.'],
  ['cellar', 'Sommelier', 'Logged three wines in the cellar.', 'Stock the cellar.'],
  ['engrave', 'Personal effects', 'Engraved a custom inscription.', 'Leave your mark on the back.'],
  ['notes', 'Case notes', 'Kept three session notes.', 'Write it down.'],
  ['session', 'A good patient', 'Completed a focus session with the Doctor.', 'Sit through a whole session.'],
  ['lights', 'Lights out', 'Put the watch on the nightstand.', 'Let it keep watch while you sleep.'],
  ['ambience', 'Full orchestra', 'Played every ambience channel at once.', 'Turn every slider up.'],
  ['catalogue', 'Catalogue photography', 'Exported a product shot.', 'Pose for the catalogue.'],
  ['stars', 'Stargazer', 'Studied the sky chart after dark.', 'Look up at night.'],
  ['moth', 'Lepidopterist', 'Caught a moth by clicking it.', 'Be quick with a hovering moth.'],
  ['tourb', 'Against gravity', 'Watched the tourbillon make a full turn.', 'Patience: one whole minute.'],
  ['bespoke', 'Bespoke', 'Changed the case metal or the strap.', 'Visit the tailor.']
];
const Ach = {
  got: Store.get('ach', {}),
  has(id) { return !!this.got[id]; },
  count() { return ACH.filter(a => this.got[a[0]]).length; },
  unlock(id) {
    const a = ACH.find(x => x[0] === id); if (!a || this.got[id]) return false;
    this.got[id] = Date.now(); Store.set('ach', this.got);
    const t = $('#medal'); if (t) { t.innerHTML = `<i aria-hidden="true">✦</i><div><small>Achievement unlocked · ${this.count()} / ${ACH.length}</small><b>${a[1]}</b><span>${a[2]}</span></div>`; t.classList.remove('show'); void t.offsetWidth; t.classList.add('show'); clearTimeout(this._t); this._t = setTimeout(() => t.classList.remove('show'), 4200); }
    if (Snd.ctx) { const c = Snd.ctx.currentTime; Snd.bell(1318.5, c + 0.02, 0.12, 1.6); Snd.bell(1760, c + 0.14, 0.1, 1.8); }
    Bus.emit('ach:changed', id); return true;
  },
  reset() { this.got = {}; Store.set('ach', this.got); Bus.emit('ach:changed'); }
};
Bus.on('ach', (id) => Ach.unlock(id));

/* ——— Location & solar events ——— */
const Loc = {
  DEF: { lat: 32.7593, lon: -97.7973, name: 'Weatherford, Texas' },
  get() { return Store.get('loc', this.DEF); },
  set(v) { Store.set('loc', v); Bus.emit('loc', v); },
  fmt(v = this.get()) { return `${Math.abs(v.lat).toFixed(2)}° ${v.lat >= 0 ? 'N' : 'S'}, ${Math.abs(v.lon).toFixed(2)}° ${v.lon >= 0 ? 'E' : 'W'}`; }
};
function solarDay(date, lat, lon) {
  const d0 = new Date(date); d0.setHours(0, 0, 0, 0); const t0 = d0.getTime(), step = 2 * 60000, N = 24 * 30;
  const alt = (t) => sunAltitude(lat, lon, new Date(t)); const S = []; for (let i = 0; i <= N; i++) S.push(alt(t0 + i * step));
  const cross = (th, up) => { for (let i = 0; i < N; i++) { const a = S[i] - th, b = S[i + 1] - th; if (up ? (a < 0 && b >= 0) : (a >= 0 && b < 0)) { let lo = t0 + i * step, hi = lo + step; for (let k = 0; k < 16; k++) { const m = (lo + hi) / 2; if ((alt(m) - th < 0) === up) lo = m; else hi = m; } return new Date((lo + hi) / 2); } } return null; };
  let mi = 0; S.forEach((v, i) => { if (v > S[mi]) mi = i; });
  return { t0, step, S, rise: cross(-0.833, true), set: cross(-0.833, false), noon: new Date(t0 + mi * step), noonAlt: S[mi], dawn: cross(-6, true), dusk: cross(-6, false),
    goldAmEnd: cross(6, true), goldPmStart: cross(6, false), blueAmEnd: cross(-4, true), bluePmStart: cross(-4, false) };
}

/* ——— Straps, and the product-shot compositor ——— */
const STRAPS = {
  calf: { name: 'Black calf', blurb: 'Smooth box calf, ivory saddle stitch', base: '#17120e', hi: '#4a3d33', stitch: 'rgba(233,222,196,.85)', kind: 'calf' },
  cognac: { name: 'Cognac alligator', blurb: 'Hand-stitched, square scales', base: '#7d3f16', hi: '#c47a3c', stitch: 'rgba(240,210,160,.7)', kind: 'gator' },
  oxblood: { name: 'Oxblood alligator', blurb: 'Deep burgundy, polished finish', base: '#4b0d13', hi: '#95303a', stitch: 'rgba(210,150,140,.65)', kind: 'gator' },
  midnight: { name: 'Midnight alligator', blurb: 'Navy blue, tone-on-tone stitch', base: '#111a33', hi: '#3a4f86', stitch: 'rgba(160,180,230,.6)', kind: 'gator' },
  bracelet: { name: 'Three-link bracelet', blurb: 'Brushed outer links, polished centre', kind: 'bracelet' }
};
const Showcase = {
  strapSeg(x, R, len, st, M) {
    const y0 = R * 0.9, y1 = y0 + len, w0 = R * 1.0, w1 = st.kind === 'bracelet' ? R * 0.92 : R * 0.8, rng = mulberry32(3);
    const wAt = (y) => lerp(w0, w1, clamp((y - y0) / len, 0, 1));
    x.save(); x.beginPath(); x.moveTo(-w0 / 2, y0); x.lineTo(-w1 / 2, y1); x.lineTo(w1 / 2, y1); x.lineTo(w0 / 2, y0); x.closePath(); x.clip();
    if (st.kind === 'bracelet') {
      const lh = R * 0.15; x.fillStyle = M[4]; x.fillRect(-w0, y0, w0 * 2, len);
      for (let y = y0, i = 0; y < y1; y += lh, i++) {
        const w = wAt(y), cw = w * 0.34;
        [[-w / 2, -cw / 2 - 1], [cw / 2 + 1, w / 2]].forEach(([a, b]) => { const g = x.createLinearGradient(a, 0, b, 0); g.addColorStop(0, M[2]); g.addColorStop(0.5, M[1]); g.addColorStop(1, M[2]); x.fillStyle = g; roundRect(x, a + 0.8, y + 0.8, b - a - 1.6, lh - 1.6, R * 0.015); x.fill();
          x.save(); x.clip(); x.strokeStyle = 'rgba(255,255,255,.12)'; x.lineWidth = 0.6; for (let k = 0; k < 22; k++) { const yy = y + rng() * lh; x.beginPath(); x.moveTo(a, yy); x.lineTo(b, yy); x.stroke(); } x.restore(); });
        const g = x.createLinearGradient(-cw / 2, 0, cw / 2, 0); g.addColorStop(0, M[4]); g.addColorStop(0.2, M[0]); g.addColorStop(0.45, M[3]); g.addColorStop(0.6, M[2]); g.addColorStop(0.85, M[0]); g.addColorStop(1, M[4]);
        x.fillStyle = g; roundRect(x, -cw / 2, y + 0.6, cw, lh - 1.2, R * 0.03); x.fill(); x.strokeStyle = 'rgba(0,0,0,.35)'; x.lineWidth = 0.8; x.stroke();
      }
    } else {
      x.fillStyle = st.base; x.fillRect(-w0, y0, w0 * 2, len);
      if (st.kind === 'gator') {
        const groove = mix(st.base, '#000000', 0.55); x.fillStyle = groove; x.fillRect(-w0, y0, w0 * 2, len);
        const cols = [-0.5, -0.4, -0.27, -0.1, 0.1, 0.27, 0.4, 0.5];
        for (let y = y0; y < y1;) { const t = (y - y0) / len, rh = R * (0.13 - 0.04 * t) * (0.85 + rng() * 0.3), w = wAt(y);
          for (let c = 0; c < cols.length - 1; c++) { const a = cols[c] * w, b = cols[c + 1] * w, j = (rng() - 0.5) * R * 0.01;
            const g = x.createRadialGradient((a + b) / 2 - R * 0.01, y + rh * 0.4, 0, (a + b) / 2, y + rh / 2, Math.max(b - a, rh) * 0.7); g.addColorStop(0, st.hi); g.addColorStop(0.6, st.base); g.addColorStop(1, mix(st.base, '#000000', 0.3));
            x.fillStyle = g; roundRect(x, a + 1.1 + j, y + 1.1, b - a - 2.2, rh - 2.2, Math.min(b - a, rh) * 0.28); x.fill(); }
          y += rh; }
      } else {
        for (let k = 0; k < 2600; k++) { x.fillStyle = `rgba(${rng() < 0.5 ? '255,255,255' : '0,0,0'},${rng() * 0.06})`; x.fillRect((rng() - 0.5) * w0, y0 + rng() * len, 1.2, 1.2); }
      }
      // cylindrical shading & edge paint
      const sh = x.createLinearGradient(-w0 / 2, 0, w0 / 2, 0); sh.addColorStop(0, 'rgba(0,0,0,.6)'); sh.addColorStop(0.12, 'rgba(0,0,0,.1)'); sh.addColorStop(0.35, 'rgba(255,255,255,.1)'); sh.addColorStop(0.6, 'rgba(0,0,0,0)'); sh.addColorStop(0.9, 'rgba(0,0,0,.25)'); sh.addColorStop(1, 'rgba(0,0,0,.65)');
      x.fillStyle = sh; x.fillRect(-w0, y0, w0 * 2, len);
      // saddle stitching
      x.setLineDash([R * 0.035, R * 0.022]); x.lineWidth = Math.max(1, R * 0.008); x.lineCap = 'round';
      [-1, 1].forEach(s => { x.beginPath(); x.moveTo(s * (w0 / 2 - R * 0.06), y0); x.lineTo(s * (w1 / 2 - R * 0.055), y1); x.strokeStyle = 'rgba(0,0,0,.5)'; x.save(); x.translate(0.8, 1); x.stroke(); x.restore(); x.strokeStyle = st.stitch; x.stroke(); });
      x.setLineDash([]);
    }
    // the case shades the strap where it meets the lugs
    const cs = x.createLinearGradient(0, y0, 0, y0 + R * 0.45); cs.addColorStop(0, 'rgba(0,0,0,.7)'); cs.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = cs; x.fillRect(-w0, y0, w0 * 2, R * 0.45);
    x.restore();
    x.save(); x.beginPath(); x.moveTo(-w0 / 2, y0); x.lineTo(-w1 / 2, y1); x.moveTo(w0 / 2, y0); x.lineTo(w1 / 2, y1); x.strokeStyle = 'rgba(0,0,0,.6)'; x.lineWidth = 1.5; x.stroke(); x.restore();
  },
  /* Draw straps into ctx centred at (cx,cy) for a watch of case radius R; fades out at the ends. */
  straps(ctx, cx, cy, R, len, id = Settings.strap) {
    const st = STRAPS[id] || STRAPS.calf, M = Watch.M(), H = Math.ceil((R * 0.9 + len) * 2 + 4), Wd = Math.ceil(R * 1.2);
    const c = document.createElement('canvas'), sc = 1; c.width = Wd * sc; c.height = H * sc; const x = c.getContext('2d'); x.translate(Wd / 2, H / 2);
    this.strapSeg(x, R, len, st, M); x.save(); x.scale(1, -1); this.strapSeg(x, R, len, st, M); x.restore();
    x.globalCompositeOperation = 'destination-in'; const f = x.createLinearGradient(0, -H / 2, 0, H / 2); f.addColorStop(0, 'rgba(0,0,0,0)'); f.addColorStop(0.16, '#000'); f.addColorStop(0.84, '#000'); f.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = f; x.fillRect(-Wd, -H / 2, Wd * 2, H);
    ctx.drawImage(c, cx - Wd / 2, cy - H / 2);
  },
  preview(canvas) {
    const d = Math.min(devicePixelRatio || 1, 2), Wc = canvas.clientWidth || 420, Hc = canvas.clientHeight || 520; canvas.width = Wc * d; canvas.height = Hc * d;
    const x = canvas.getContext('2d'); x.setTransform(d, 0, 0, d, 0, 0);
    const bg = x.createRadialGradient(Wc / 2, Hc * 0.45, 0, Wc / 2, Hc * 0.45, Hc * 0.7); bg.addColorStop(0, '#2b211c'); bg.addColorStop(1, '#070605'); x.fillStyle = bg; x.fillRect(0, 0, Wc, Hc);
    const px = Math.min(Wc * 0.95, Hc * 0.7), R = px * 0.375; this.straps(x, Wc / 2, Hc / 2, R, Hc / 2 - R * 0.9);
    x.drawImage(Watch.renderHi(Math.round(px * d)), Wc / 2 - px / 2, Hc / 2 - px / 2, px, px);
  },
  /* 1800 × 2400 catalogue photograph with Cinco Corporation letterhead. */
  shot() {
    const W = 1800, H = 2400, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'), T = Watch.theme, now = new Date();
    const bg = x.createRadialGradient(W / 2, H * 0.47, 0, W / 2, H * 0.47, H * 0.75); bg.addColorStop(0, '#34271f'); bg.addColorStop(0.55, '#140f0c'); bg.addColorStop(1, '#050404'); x.fillStyle = bg; x.fillRect(0, 0, W, H);
    const rng = mulberry32(9); for (let k = 0; k < 60000; k++) { x.fillStyle = `rgba(${rng() < 0.5 ? '255,240,220' : '0,0,0'},${rng() * 0.05})`; x.fillRect(rng() * W, rng() * H, 1.5, 1.5); }
    // spotlight cone
    const sp = x.createRadialGradient(W / 2, H * 0.1, 0, W / 2, H * 0.1, H * 0.9); sp.addColorStop(0, 'rgba(255,235,200,.10)'); sp.addColorStop(1, 'rgba(255,235,200,0)'); x.fillStyle = sp; x.beginPath(); x.moveTo(W * 0.42, 0); x.lineTo(W * 0.58, 0); x.lineTo(W * 0.95, H * 0.85); x.lineTo(W * 0.05, H * 0.85); x.closePath(); x.fill();
    // letterhead
    const gold = '#d4b577'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = gold;
    for (let k = 0; k < 5; k++) { const a = (k - 2) * 0.2; star(x, W / 2 + Math.sin(a) * 90, 120 + 90 - Math.cos(a) * 90, 13, gold); }
    x.font = '600 64px Cinzel, serif'; spacedText(x, 'CINCO CORPORATION', W / 2, 205, 22);
    x.font = 'italic 34px "Cormorant Garamond", serif'; x.fillStyle = 'rgba(236,228,210,.7)'; x.fillText("Maison d'Horlogerie · Firenze · established 1991", W / 2, 262);
    x.strokeStyle = 'rgba(212,181,119,.45)'; x.lineWidth = 2; [[300, 1500]].forEach(([a, b]) => { x.beginPath(); x.moveTo(a, 305); x.lineTo(b, 305); x.stroke(); x.beginPath(); x.moveTo(a + 60, 314); x.lineTo(b - 60, 314); x.lineWidth = 1; x.stroke(); });
    // floor shadow, straps, watch
    const cy = 1130, px = 1400, R = px * 0.375;
    const fs = x.createRadialGradient(W / 2, cy + R * 0.25, R * 0.2, W / 2, cy + R * 0.25, R * 1.5); fs.addColorStop(0, 'rgba(0,0,0,.55)'); fs.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = fs; x.beginPath(); x.ellipse(W / 2, cy + R * 0.25, R * 1.6, R * 1.35, 0, 0, TAU); x.fill();
    this.straps(x, W / 2, cy, R, 330);
    x.drawImage(Watch.renderHi(px, now), W / 2 - px / 2, cy - px / 2);
    // case back inset
    try { CaseBack.render(now); const ir = 170, ix = W - 250, iy = 1930; x.save(); x.beginPath(); x.arc(ix, iy, ir, 0, TAU); x.fillStyle = '#0b0908'; x.fill(); x.clip(); x.drawImage(CaseBack.cv, ix - ir * 1.35, iy - ir * 1.35, ir * 2.7, ir * 2.7); x.restore();
      x.beginPath(); x.arc(ix, iy, ir, 0, TAU); x.strokeStyle = 'rgba(212,181,119,.6)'; x.lineWidth = 3; x.stroke(); x.fillStyle = 'rgba(236,228,210,.6)'; x.font = 'italic 28px "Cormorant Garamond", serif'; x.fillText('Exhibition case back', ix, iy + ir + 36); } catch (e) {}
    // caption
    x.fillStyle = '#efe7d6'; x.font = '150px "Pinyon Script", cursive'; x.fillText('The Lecter', W / 2 - 150, 1905);
    x.font = '600 34px Cinzel, serif'; x.fillStyle = gold; spacedText(x, '“IL DOTTORE” · CALIBRE C-1991', W / 2 - 150, 2010, 8);
    const E = CaseBack.engraving(), cfg = [`${T.name} dial`, `${METAL_NAMES[Watch.metal()] || 'Steel'} case`, (STRAPS[Settings.strap] || STRAPS.calf).name];
    x.font = 'italic 38px "Cormorant Garamond", serif'; x.fillStyle = 'rgba(236,228,210,.85)'; x.fillText(cfg.join('  ·  '), W / 2 - 150, 2075);
    x.font = 'italic 32px "Cormorant Garamond", serif'; x.fillStyle = 'rgba(236,228,210,.6)'; x.fillText(`Engraved: “${E.text}”${Watch.variant() ? '  ·  Tourbillon aperture' : ''}`, W / 2 - 150, 2130);
    x.font = '600 22px Cinzel, serif'; x.fillStyle = 'rgba(212,181,119,.6)'; spacedText(x, `REF. C-1991 · Nº 0417 / 1000 · ${now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}`, W / 2, 2300, 6);
    x.font = 'italic 24px "Cormorant Garamond", serif'; x.fillStyle = 'rgba(236,228,210,.35)'; x.fillText('A fictional timepiece, rendered for the catalogue of Cinco Corporation.', W / 2, 2350);
    return c;
  }
};

/* ——— Nightstand / screensaver ——— */
const Night = {
  on: false, el: null, cv: null, last: 0,
  build() {
    if (this.el) return; this.el = el('div', { id: 'night', role: 'dialog', 'aria-label': 'Nightstand clock. Press any key or tap to wake.' });
    this.el.innerHTML = `<div class="nt-drift"><canvas id="nt-cv" aria-hidden="true"></canvas><div class="nt-dig" id="nt-dig"></div><div class="nt-date" id="nt-date"></div></div><div class="nt-hint">Tap or press any key to wake</div>`;
    document.body.appendChild(this.el); this.cv = $('#nt-cv', this.el);
    const wake = (e) => { if (!this.on) return; if (e.type === 'pointermove' && (Math.abs(e.movementX) + Math.abs(e.movementY) < 6 || performance.now() - this.t0 < 1200)) return; if (performance.now() - this.t0 < 500) return; this.stop(); };
    ['pointerdown', 'keydown', 'wheel', 'pointermove'].forEach(ev => addEventListener(ev, wake, { passive: true, capture: true }));
  },
  start(user) {
    this.build(); if (this.on) return; this.on = true; this.t0 = performance.now(); this.el.classList.add('show'); this.el.classList.toggle('digital', Settings.nightStyle === 'digital');
    this.el.style.setProperty('--dim', Settings.nightDim); document.body.classList.add('night');
    if (user && document.documentElement.requestFullscreen && !document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
    this.resize(); this.drift(); clearInterval(this._dr); this._dr = setInterval(() => this.drift(), 30000); Bus.emit('ach', 'lights');
    requestAnimationFrame(t => this.loop(t));
  },
  stop() { if (!this.on) return; this.on = false; this.el.classList.remove('show'); document.body.classList.remove('night'); clearInterval(this._dr); if (document.fullscreenElement && this._fs !== false) document.exitFullscreen().catch(() => {}); App.lastInput = performance.now(); },
  resize() { const s = Math.min(innerWidth, innerHeight) * 0.62, d = Math.min(devicePixelRatio || 1, 2); this.cv.style.width = this.cv.style.height = s + 'px'; this.cv.width = this.cv.height = Math.round(s * d); this.S = s; this.d = d; },
  drift() { const dx = (Math.random() - 0.5) * innerWidth * 0.12, dy = (Math.random() - 0.5) * innerHeight * 0.1; $('.nt-drift', this.el).style.transform = `translate(${dx.toFixed(0)}px, ${dy.toFixed(0)}px)`; },
  loop(t) {
    if (!this.on) return; requestAnimationFrame(tt => this.loop(tt)); if (t - this.last < 32) return; this.last = t;
    const now = new Date(); $('#nt-dig').textContent = fmtClock(now, Settings.h24); $('#nt-date').textContent = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) + ' · ' + moonPhase(now).name.toLowerCase();
    if (Settings.nightStyle === 'digital') return;
    const x = this.cv.getContext('2d'), S = this.S, r = S / 2 * 0.92, T = Watch.theme, glow = T.nv ? 'rgba(160,255,150,' : 'rgba(170,255,200,';
    x.setTransform(this.d, 0, 0, this.d, S / 2 * this.d, S / 2 * this.d); x.clearRect(-S, -S, S * 2, S * 2);
    x.beginPath(); x.arc(0, 0, r, 0, TAU); x.strokeStyle = 'rgba(200,169,106,.18)'; x.lineWidth = 1.2; x.stroke();
    x.fillStyle = 'rgba(200,169,106,.45)'; x.textAlign = 'center'; x.font = `600 ${r * 0.06}px Cinzel, serif`; spacedText(x, 'CINCO CORPORATION', 0, -r * 0.45, r * 0.02);
    x.shadowColor = glow + '.9)'; x.shadowBlur = r * 0.06; x.fillStyle = glow + '.85)';
    for (let h = 0; h < 12; h++) { x.save(); x.rotate(h / 12 * TAU); roundRect(x, -r * 0.018, -r * 0.93, r * 0.036, h % 3 ? r * 0.08 : r * 0.13, r * 0.01); x.fill(); x.restore(); }
    const ms = now.getMilliseconds(), s = now.getSeconds() + ms / 1000, m = now.getMinutes() + s / 60, hh = (now.getHours() % 12) + m / 60;
    const hand = (a, len, w) => { x.save(); x.rotate(a); x.beginPath(); x.moveTo(-w, r * 0.08); x.lineTo(-w * 0.6, -len); x.lineTo(0, -len - w); x.lineTo(w * 0.6, -len); x.lineTo(w, r * 0.08); x.closePath(); x.fill(); x.restore(); };
    hand(hh / 12 * TAU, r * 0.5, r * 0.035); hand(m / 60 * TAU, r * 0.8, r * 0.026);
    x.shadowBlur = 0; x.strokeStyle = T.nv ? '#d9ffd0' : '#c1272d'; x.lineWidth = 1.2; x.save(); x.rotate(Math.floor(s * 8) / 8 / 60 * TAU); x.beginPath(); x.moveTo(0, r * 0.15); x.lineTo(0, -r * 0.88); x.stroke(); x.restore();
    x.beginPath(); x.arc(0, 0, r * 0.03, 0, TAU); x.fillStyle = '#222'; x.fill();
  }
};
