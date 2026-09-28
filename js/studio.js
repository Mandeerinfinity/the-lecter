/* XI. Charcoal sketch — XII. Harpsichord — XIII. Dials — XIV. Dossier — XV. Settings */
'use strict';
const Sketch = {
  paper: null, ink: null, guide: null, brush: null, d: 1,
  init(wrap) {
    this.paper = $('#sk-paper', wrap); this.ink = $('#sk-ink', wrap); this.guide = $('#sk-guide', wrap);
    this.brush = new CharcoalBrush(this.ink.getContext('2d')); this.resize(true);
    const pos = (e) => { const r = this.ink.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    let down = false, lt = 0, lp = null;
    this.ink.addEventListener('pointerdown', e => { e.preventDefault(); this.ink.setPointerCapture(e.pointerId); down = true; const [x, y] = pos(e); lp = [x, y]; lt = performance.now(); this.brush.down(x, y, e.pointerType === 'pen' ? e.pressure : 0.6); this.dirty = true; });
    this.ink.addEventListener('pointermove', e => { if (!down) return; const [x, y] = pos(e), now = performance.now(), v = Math.hypot(x - lp[0], y - lp[1]) / Math.max(1, now - lt);
      const p = e.pointerType === 'pen' ? Math.max(0.1, e.pressure) : clamp(0.85 - v * 0.35, 0.25, 0.9); this.brush.move(x, y, p); lp = [x, y]; lt = now; });
    const up = () => { down = false; this.brush.up(); }; ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => this.ink.addEventListener(ev, up));
  },
  resize(first) {
    const W = this.ink.clientWidth, H = this.ink.clientHeight; if (!W) return; const d = Math.min(devicePixelRatio || 1, 2); this.d = d;
    let keep = null; if (!first && this.ink.width) { keep = document.createElement('canvas'); keep.width = this.ink.width; keep.height = this.ink.height; keep.getContext('2d').drawImage(this.ink, 0, 0); }
    [this.paper, this.ink, this.guide].forEach(c => { c.width = W * d; c.height = H * d; c.getContext('2d').setTransform(d, 0, 0, d, 0, 0); });
    this.brush.dpr = d; if (keep) { const x = this.ink.getContext('2d'); x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.drawImage(keep, 0, 0, this.ink.width, this.ink.height); x.restore(); }
    this.drawPaper(); this.drawGuide(this.guideMode || 'florence');
  },
  drawPaper() {
    const x = this.paper.getContext('2d'), W = this.paper.width / this.d, H = this.paper.height / this.d;
    const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#ece5d5'); g.addColorStop(1, '#d9cfba'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    const id = x.getImageData(0, 0, this.paper.width, this.paper.height), dd = id.data, pw = this.paper.width;
    for (let i = 0; i < dd.length; i += 4) { const p = i / 4, t = Tooth.at(p % pw, p / pw | 0) - 0.5; dd[i] += t * 26; dd[i + 1] += t * 24; dd[i + 2] += t * 20; }
    x.putImageData(id, 0, 0);
    const r = mulberry32(4); x.strokeStyle = 'rgba(120,100,70,.08)'; for (let i = 0; i < 90; i++) { const px = r() * W, py = r() * H, a = r() * TAU, l = 6 + r() * 20; x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + Math.cos(a) * l * 0.5 + 3, py + Math.sin(a) * l * 0.5, px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke(); }
  },
  drawGuide(mode) {
    this.guideMode = mode; const x = this.guide.getContext('2d'), W = this.guide.width / this.d, H = this.guide.height / this.d; x.clearRect(0, 0, W, H);
    if (mode === 'florence') drawFlorence(x, W * 0.04, H * 0.1, W * 0.92, { color: 'rgba(60,50,40,.22)', passes: 1, seed: 7, lw: 0.8 });
    else if (mode === 'dial') { x.strokeStyle = 'rgba(60,50,40,.22)'; x.lineWidth = 0.8; const c = [W / 2, H / 2], R = Math.min(W, H) * 0.4;
      [1, 0.84, 0.8].forEach(k => { x.beginPath(); x.arc(c[0], c[1], R * k, 0, TAU); x.stroke(); });
      for (let h = 0; h < 12; h++) { const a = h / 12 * TAU; x.beginPath(); x.moveTo(c[0] + Math.sin(a) * R * 0.6, c[1] - Math.cos(a) * R * 0.6); x.lineTo(c[0] + Math.sin(a) * R * 0.74, c[1] - Math.cos(a) * R * 0.74); x.stroke(); }
      [[-0.36, 0], [0.36, 0], [0, 0.34]].forEach(([a, b]) => { x.beginPath(); x.arc(c[0] + a * R, c[1] + b * R, R * 0.16, 0, TAU); x.stroke(); }); }
  },
  clear() { const x = this.ink.getContext('2d'); x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, this.ink.width, this.ink.height); x.restore(); },
  save() {
    const c = document.createElement('canvas'); c.width = this.ink.width; c.height = this.ink.height; const x = c.getContext('2d');
    x.drawImage(this.paper, 0, 0); x.drawImage(this.ink, 0, 0);
    x.fillStyle = 'rgba(40,32,24,.55)'; x.font = `${16 * this.d}px "Pinyon Script", cursive`; x.textAlign = 'right'; x.fillText('after the Florentine manner · Cinco Corporation', c.width - 14 * this.d, c.height - 12 * this.d);
    downloadDataURL(c.toDataURL('image/png'), 'charcoal-sketch.png'); toast('Sketch saved as PNG'); Bus.emit('ach', 'sketch');
  }
};
MODES.push({
  id: 'sketch', name: 'Carboncino', label: 'Sketch', kicker: 'Divertimento IV', icon: 'sketch', sub: 'Charcoal on toned paper, drawn from memory. You can also draw straight on the crystal.',
  build(el) {
    el.innerHTML = `<div class="seg tools" id="sk-tools"><button data-t="charcoal" class="on">Charcoal</button><button data-t="chalk">White chalk</button><button data-t="smudge">Blend</button><button data-t="eraser">Kneaded eraser</button></div>
      <div class="sk-row"><label class="lbl">Size <input type="range" id="sk-size" min="2" max="26" value="7"></label><label class="lbl">Guide <select id="sk-guide-sel"><option value="florence">Florence (Duomo)</option><option value="dial">Watch dial</option><option value="none">None</option></select></label></div>
      <div class="sk-wrap"><canvas id="sk-paper"></canvas><canvas id="sk-guide"></canvas><canvas id="sk-ink" class="sketch"></canvas></div>
      <div class="btn-row"><button class="btn" id="sk-clear">Clear paper</button><button class="btn primary" id="sk-save">Save PNG</button></div>
      <div class="rule"></div><div class="btn-row"><label class="chk"><input type="checkbox" id="sk-dial"> Draw on the dial</label><button class="btn ghost" id="sk-dclear">Wipe dial</button><button class="btn ghost" id="sk-dsave">Save dial PNG</button></div>
      <p class="fine">With a stylus, pressure changes the stroke. With a mouse or finger, slow strokes lay down more charcoal. The guide lines don't appear in the saved PNG.</p>`;
    Sketch.init(el);
    $$('#sk-tools button', el).forEach(b => b.onclick = () => { $$('#sk-tools button').forEach(x => x.classList.remove('on')); b.classList.add('on'); Sketch.brush.tool = b.dataset.t; DialInk.brush.tool = b.dataset.t === 'smudge' ? 'charcoal' : b.dataset.t; });
    $('#sk-size', el).oninput = (e) => { Sketch.brush.size = +e.target.value; DialInk.brush.size = +e.target.value * 0.7; };
    $('#sk-guide-sel', el).onchange = (e) => Sketch.drawGuide(e.target.value);
    $('#sk-clear', el).onclick = () => Sketch.clear(); $('#sk-save', el).onclick = () => Sketch.save();
    $('#sk-dial', el).onchange = (e) => { DialInk.setOn(e.target.checked); toast(e.target.checked ? 'Draw on the crystal. Untick the box to go back to normal.' : 'Dial drawing off'); };
    $('#sk-dclear', el).onclick = () => DialInk.clear();
    $('#sk-dsave', el).onclick = () => { const c = Watch.snapshot(1000); c.getContext('2d').drawImage(DialInk.cv, 0, 0, 1000, 1000); downloadDataURL(c.toDataURL('image/png'), 'lecter-dial-sketch.png'); toast('Dial saved as PNG'); Bus.emit('ach', 'sketch'); };
  },
  show() { requestAnimationFrame(() => Sketch.resize()); },
  hide() { DialInk.setOn(false); const c = $('#sk-dial'); if (c) c.checked = false; }
});

/* ——— XII. Harpsichord ——— */
const PIECES = [
  ['aria', 'Aria da capo', 'G major · a sarabande with ornamented cadences'], ['invention', 'Invention in D minor', 'Two voices in imitation over a circle of fifths'],
  ['prelude', 'Prelude in C', 'Broken chords over a voice-led progression that changes every time'], ['passacaglia', 'Passacaglia in C minor', 'A lament ground bass with variations that keep getting busier'],
  ['toccata', 'Toccata (Réveil)', 'The alarm piece: bright, insistent, cheerful']
];
MODES.push({
  id: 'music', name: 'Clavicembalo', label: 'Music', kicker: 'Divertimento V', icon: 'music', sub: 'A harpsichord built from arithmetic. Each piece is composed fresh in the Baroque manner, so no two performances are the same.',
  build(el) {
    el.innerHTML = `<ul class="pieces">${PIECES.map(([id, n, d]) => `<li data-id="${id}"><button><b>${n}</b><small>${d}</small></button></li>`).join('')}</ul>
      <canvas id="mu-roll" class="mu-roll"></canvas><div class="meter thin"><span id="mu-prog"></span></div>
      <div class="btn-row"><button class="btn primary" id="mu-play">Play</button><button class="btn" id="mu-var">New variation</button><label class="chk"><input type="checkbox" id="mu-loop" checked> Continue</label></div>
      <div class="sk-row"><label class="lbl">Volume <input type="range" id="mu-vol" min="0" max="1" step="0.01"></label><label class="lbl">Tempo <input type="range" id="mu-tempo" min="0.7" max="1.35" step="0.01" value="1"></label></div>
      <p class="fine" id="mu-now">Nothing playing. Choose a piece, or press <kbd>Space</kbd>.</p>`;
    this.sel = 'aria'; this.mark(); this.hist = [];
    $$('.pieces li', el).forEach(li => $('button', li).onclick = () => { this.sel = li.dataset.id; this.mark(); Player.play(this.sel); });
    $('#mu-play', el).onclick = () => this.toggle();
    $('#mu-var', el).onclick = () => Player.play(this.sel, Math.floor(Math.random() * 1e6));
    $('#mu-loop', el).onchange = (e) => Player.loop = e.target.checked;
    $('#mu-vol', el).value = Settings.musicVol; $('#mu-vol', el).oninput = (e) => { setSetting('musicVol', +e.target.value); Snd.setMusicVol(+e.target.value); };
    $('#mu-tempo', el).oninput = (e) => { const old = Player.tempo, nw = +e.target.value; if (Player.playing) { const now = Snd.ctx.currentTime, beat = (now - Player.startAt) / (60 / (Player.piece.bpm * old)); Player.tempo = nw; Player.startAt = now - beat * (60 / (Player.piece.bpm * nw)); Player.idx = Player.piece.ev.findIndex(ev => ev.t > beat + 0.01); if (Player.idx < 0) Player.idx = Player.piece.ev.length; } else Player.tempo = nw; };
    Bus.on('music', () => this.ui());
  },
  toggle() { if (Player.playing) Player.stop(); else Player.play(this.sel); },
  mark() { $$('.pieces li').forEach(li => li.classList.toggle('on', li.dataset.id === this.sel)); },
  ui() { const b = $('#mu-play'); if (!b) return; b.textContent = Player.playing ? 'Pause' : 'Play'; $('#mu-now').innerHTML = Player.playing ? `Now playing: <em>${Player.piece.name}</em>, ${Player.piece.key}, variation ${Player.seed % 1000}` : 'Nothing playing. Choose a piece, or press <kbd>Space</kbd>.'; },
  frame() {
    const cv = $('#mu-roll'); if (!cv) return; const d = Math.min(devicePixelRatio || 1, 2), W = cv.clientWidth, H = cv.clientHeight; if (!W) return; if (cv.width !== W * d) { cv.width = W * d; cv.height = H * d; }
    const x = cv.getContext('2d'); x.setTransform(d, 0, 0, d, 0, 0); x.clearRect(0, 0, W, H);
    const lo = 36, hi = 96, kH = H * 0.3, rollH = H - kH, now = Snd.ctx ? Snd.ctx.currentTime : 0, span = 4;
    const white = []; for (let m = lo; m <= hi; m++) if (![1, 3, 6, 8, 10].includes(m % 12)) white.push(m);
    const kw = W / white.length, xOf = (m) => { const wi = white.indexOf(m); if (wi >= 0) return wi * kw + kw / 2; return white.indexOf(m - 1) * kw + kw; };
    // roll
    x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(0, 0, W, rollH);
    Player.hist.forEach(a => { if (a.on > now) return; const y = (t) => rollH - (now - t) / span * rollH; const top = y(a.on), bot = y(Math.min(a.off, now)); if (bot < 0) return;
      const live = a.off > now; x.globalAlpha = live ? 1 : 0.55; x.fillStyle = live ? Watch.theme.accent : 'rgba(236,230,216,.75)'; roundRect(x, xOf(a.m) - kw * 0.36, Math.max(0, top), kw * 0.72, Math.max(2, bot - Math.max(0, top)), 2); x.fill(); });
    x.globalAlpha = 1;
    const on = new Set(Player.playing ? Player.sounding() : []);
    white.forEach((m, i) => { x.fillStyle = on.has(m) ? Watch.theme.accent : '#efe7d5'; x.fillRect(i * kw + 0.5, rollH, kw - 1, kH); });
    for (let m = lo; m <= hi; m++) if ([1, 3, 6, 8, 10].includes(m % 12)) { x.fillStyle = on.has(m) ? Watch.theme.accent : '#1b1714'; x.fillRect(xOf(m) - kw * 0.32, rollH, kw * 0.64, kH * 0.62); }
    x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(0, rollH, W, 2);
    $('#mu-prog').style.width = (Player.progress() * 100) + '%';
  },
  key(e) { if (e.code === 'Space') { this.toggle(); return true; } }
});

/* ——— XIII. Dials & themes ——— */
MODES.push({
  id: 'themes', name: 'Quadranti', label: 'Dials', kicker: 'Atelier', icon: 'themes', sub: 'Five dial variants, each with its own case metal, and one that stays hidden until it is earned. Press T to cycle.',
  build(el) {
    el.innerHTML = `<div class="themes" id="th-cards"></div>
      <label class="lbl">Seconds hand</label><div class="seg" id="th-sec"><button data-v="sweep">Eight-beat sweep</button><button data-v="tick">One-second tick</button><button data-v="chrono">Parked (chronograph only)</button></div>
      <label class="chk"><input type="checkbox" id="th-light"> Light follows the cursor, or the tilt of your phone</label><br><label class="chk" style="margin-top:8px"><input type="checkbox" id="th-glow"> Lume glows in the dark dials</label>
      <p class="fine">To change the case metal or strap, visit <em>Su Misura</em> on ring II. For a tourbillon in place of the moon, see <em>Turbine</em>.</p>`;
    $('#th-glow', el).checked = Settings.lumeGlow !== false; $('#th-glow', el).onchange = (e) => setSetting('lumeGlow', e.target.checked);
    this.el = el; this.renderCards();
    $$('#th-sec button', el).forEach(b => b.onclick = () => { setSetting('seconds', b.dataset.v); this.mark(); });
    $('#th-light', el).checked = Settings.lightFollow; $('#th-light', el).onchange = (e) => setSetting('lightFollow', e.target.checked);
    Bus.on('setting:theme', () => this.mark()); this.mark();
  },
  renderCards() {
    const box = $('#th-cards'); if (!box) return;
    box.innerHTML = themeOrder().map(id => { const t = THEMES[id], M = METALS[t.metal]; return `<button class="theme-card${t.secret ? ' secret' : ''}" data-t="${id}" aria-pressed="false"><span class="sw" style="background:radial-gradient(circle at 35% 30%, ${t.dial[0]}, ${t.dial[1]} 70%); box-shadow: 0 0 0 4px ${M[1]}, 0 0 0 5px ${M[4]}, 0 6px 14px rgba(0,0,0,.5)"><i style="background:${t.accent}"></i></span><b>${t.name}</b><small>${t.blurb}</small></button>`; }).join('');
    $$('.theme-card', box).forEach(b => b.onclick = () => App.setTheme(b.dataset.t)); this.mark();
  },
  mark() { $$('.theme-card').forEach(b => { b.classList.toggle('on', b.dataset.t === Settings.theme); b.setAttribute('aria-pressed', b.dataset.t === Settings.theme); }); $$('#th-sec button').forEach(b => b.classList.toggle('on', b.dataset.v === Settings.seconds)); }
});

/* ——— XIV. Dossier ——— */
MODES.push({
  id: 'dossier', name: 'Case File', label: 'Dossier', kicker: 'Archivio', icon: 'dossier', sub: 'A behavioural case file on the timepiece itself. Fictional in every particular.',
  build(el) {
    el.innerHTML = `<div class="folder"><div class="tabs" role="tablist"><button class="on" data-p="0">Summary</button><button data-p="1">Specifications</button><button data-p="2">Chain of custody</button></div>
      <div class="sheet"><svg class="clip" viewBox="0 0 30 80"><path d="M10 70V14a6 6 0 0 1 12 0v50a9 9 0 0 1-18 0V20" fill="none" stroke="#9aa0a6" stroke-width="3" stroke-linecap="round"/></svg>
      <div class="stamp-conf">CONFIDENTIAL</div>
      <header><small>FEDERAL BUREAU OF INVESTIGATION · BEHAVIORAL SCIENCE UNIT</small><small>PREPARED FOR CINCO CORPORATION · OFFICE OF PROVENANCE &amp; ETIQUETTE</small><h3>CASE FILE Nº 91-BSU-0417</h3></header>
      <section class="pg on">
        <div class="polaroid"><img id="ds-photo" alt="Evidence photograph of the watch"><span>EXHIBIT 7-A</span></div>
        <p><b>SUBJECT:</b> One (1) gentleman's automatic chronograph, maker's mark <b>CINCO CORPORATION</b>, dial signed <i>Il Dottore</i>. Steel case, 40 mm, exhibition back.</p>
        <p><b>CIRCUMSTANCES:</b> Recovered from a cell that the inventory calls "unusually tidy". The watch was correct to within 0.4 seconds, although the cell held no reference clock. Staff say the owner wound it at the same minute every evening and would not discuss the matter before tea.</p>
        <p><b>BEHAVIOURAL NOTES:</b> The item seems to encourage good manners in whoever wears it. Two orderlies reported an urge to say "thank you" when they checked the time. A trainee agent wore it for one afternoon and then <span class="redact" tabindex="0" data-r="arranged her desk by colour">████████████████</span>. No further incidents.</p>
        <p><b>ASSESSMENT:</b> Not dangerous. Discerning, possibly. Do not leave it face-down near cheap wine.</p></section>
      <section class="pg"><table class="spec"><tr><td>Maker</td><td>Cinco Corporation, Maison d'Horlogerie</td></tr><tr><td>Reference</td><td>C-1991 "Il Dottore"</td></tr><tr><td>Movement</td><td>Automatic column-wheel chronograph, 28,800 vph, 42 jewels, 42 h power reserve</td></tr>
        <tr><td>Complications</td><td>Chronograph (30 min), running seconds, moon phase, pointer date, tachymeter</td></tr><tr><td>Case</td><td>40 mm, polished bezel, screw-down exhibition back, water resistant to 30 m</td></tr>
        <tr><td>Dial</td><td>Five variants on record, including one seen only through <span class="redact" tabindex="0" data-r="night-vision goggles">█████████████</span></td></tr><tr><td>Inscription</td><td><i>for a mind of refined taste</i></td></tr><tr><td>Counterweight</td><td>Seconds hand ends in a small moth. Examiners declined to comment.</td></tr></table></section>
      <section class="pg"><ol class="custody">
        <li><b>1991 · Baltimore, MD</b> Logged into property. The tag reads: "Handle with courtesy."</li>
        <li><b>1991 · Quantico, VA</b> Examined by the BSU. The examiner wrote that the watch "looks back". A request for a second opinion was <span class="redact" tabindex="0" data-r="politely declined by the watch">██████████</span>.</li>
        <li><b>1992 · Memphis, TN</b> Moved during a transfer. The custodian reports the moon phase was correct, which the custodian was not.</li>
        <li><b>1999 · Florence, IT</b> Seen in an antiquarian's window near the Ponte Vecchio. Marked "not for sale". The shopkeeper was reportedly charmed.</li>
        <li><b>2003 · Bimini, BS</b> A postcard arrives at Cinco Corporation. It says only: "Running beautifully."</li>
        <li><b>Present</b> Current whereabouts: <span class="redact" tabindex="0" data-r="on your screen">████████</span>.</li></ol></section>
      <footer>This file is a work of fiction written for a Cinco Corporation novelty timepiece. Hover over or tap the redactions.</footer></div></div>`;
    $$('.tabs button', el).forEach(b => b.onclick = () => { $$('.tabs button').forEach(x => x.classList.remove('on')); b.classList.add('on'); $$('.pg').forEach((p, i) => p.classList.toggle('on', i === +b.dataset.p)); Snd.click(); });
    $$('.redact', el).forEach(r => { const show = () => { r.textContent = r.dataset.r; r.classList.add('shown'); }; r.addEventListener('mouseenter', show); r.addEventListener('focus', show); r.addEventListener('click', show); });
  },
  show() { const c = Watch.snapshot(420); $('#ds-photo').src = c.toDataURL('image/jpeg', 0.85); }
});

/* ——— XV. Settings ——— */
MODES.push({
  id: 'settings', name: 'Impostazioni', label: 'Settings', kicker: 'Regolazione', icon: 'settings', sub: 'Preferences are saved in this browser.',
  build(el) {
    const tg = (k, l) => `<label class="row-set"><span>${l}</span><label class="switch"><input type="checkbox" data-k="${k}" ${Settings[k] ? 'checked' : ''}><span></span></label></label>`;
    el.innerHTML = `<div class="set-list">${tg('h24', '24-hour time')}${tg('moths', "Death's-head moths")}<label class="row-set"><span>Moth count</span><input type="range" id="st-mc" min="4" max="60" value="${Settings.mothCount}"></label>
      ${tg('fog', 'Breath on the glass')}${tg('tick', 'Audible ticking')}${tg('hourlyChime', 'Hourly harpsichord chime')}${tg('lightFollow', 'Light follows cursor / tilt')}${tg('nvNoise', 'Night-vision grain')}${tg('lumeGlow', 'Lume glow in dark dials')}${tg('reducedMotion', 'Reduced motion')}
      ${tg('voice', 'Voice: speak the time (S) and remarks aloud')}${tg('voiceQuid', 'Voice also reads Quid pro quo')}
      <label class="row-set"><span>Master volume</span><input type="range" id="st-vol" min="0" max="1" step="0.01" value="${Settings.volume}"></label></div>
      <div class="btn-row"><button class="btn" id="st-keys">Keyboard shortcuts</button><button class="btn" id="st-intro">Replay the introduction</button><button class="btn" id="st-voice">Test the voice</button><button class="btn" id="st-fs">Fullscreen</button><button class="btn ghost" id="st-reset">Reset everything</button></div>
      <p class="fine" id="st-vname"></p><p class="fine">On phones and tablets: swipe left or right across the watch to change complication, long-press the crystal to breathe on it, and tilt the device to move the light.</p>`;
    $$('input[data-k]', el).forEach(c => c.onchange = () => { setSetting(c.dataset.k, c.checked); if (c.dataset.k === 'tick' || c.dataset.k === 'hourlyChime') Snd.ensure(); });
    $('#st-mc', el).oninput = (e) => setSetting('mothCount', +e.target.value);
    $('#st-vol', el).oninput = (e) => { setSetting('volume', +e.target.value); Snd.setVolume(+e.target.value); };
    $('#st-voice', el).onclick = () => { Voice.pick(); const ok = Voice.speak('Good evening. ' + Voice.phrase(), true); toast(ok ? 'Voice: ' + Voice.name() : 'Speech is not available in this browser'); };
    $('#st-keys', el).onclick = () => App.help(); $('#st-intro', el).onclick = () => App.intro(true); $('#st-fs', el).onclick = () => App.fullscreen();
    $('#st-reset', el).onclick = () => { if (confirm('Reset all settings, alarms, laps and timers stored by this watch?')) { Object.keys(localStorage).filter(k => k.startsWith('lecter.')).forEach(k => localStorage.removeItem(k)); location.reload(); } };
    Bus.on('setting', (k, v) => { const c = $(`input[data-k="${k}"]`, el); if (c) c.checked = !!v; });
  },
  show() { const p = $('#st-vname'); if (p) p.textContent = Voice.ok ? 'Voice available: ' + Voice.name() + '. A British voice is used when your system has one.' : 'This browser has no speech synthesis, so the voice options only show the words.'; }
});
