/* Ring II · Salone — VIII. Bespoke · IX. Engraving · X. Ambience · XI. Nightstand · XII. Vetrina · XIII. Secrets */
'use strict';

/* ——— VIII. Bespoke: case & strap ——— */
MODES.push({
  id: 'bespoke', page: 2, name: 'Su Misura', label: 'Bespoke', kicker: 'Salone VIII', icon: 'bespoke', sub: 'The tailor’s room: choose the case metal and the strap. Your choices are saved.',
  build(el) {
    const metals = ['auto', 'steel', 'platinum', 'gold', 'rose', 'bronze', 'dlc'];
    el.innerHTML = `<canvas id="bs-cv" class="bs-cv" aria-label="Preview of the watch on the chosen strap"></canvas>
      <label class="lbl">Case</label><div class="swatches" id="bs-case" role="radiogroup" aria-label="Case metal">${metals.map(m => { const M = METALS[m === 'auto' ? THEMES[Settings.theme].metal : m];
        return `<button role="radio" data-m="${m}" title="${m === 'auto' ? 'Matches the dial' : METAL_NAMES[m]}"><span style="background:conic-gradient(from 200deg, ${M[0]}, ${M[2]}, ${M[3]}, ${M[4]}, ${M[1]}, ${M[0]})"></span><small>${m === 'auto' ? 'Dial default' : METAL_NAMES[m]}</small></button>`; }).join('')}</div>
      <label class="lbl">Strap</label><div class="strap-list" id="bs-strap" role="radiogroup" aria-label="Strap">${Object.entries(STRAPS).map(([k, s]) => `<button role="radio" data-s="${k}"><i class="sw-${k}"></i><b>${s.name}</b><small>${s.blurb}</small></button>`).join('')}</div>
      <p class="fine">The case metal also changes the crown, the pushers, the repeater slide, the tourbillon bridge and the case back. On the main stage the watch rests on the bezel ring, so the strap is shown here and in the <em>Vetrina</em> product shot.</p>`;
    $$('#bs-case button', el).forEach(b => b.onclick = () => { setSetting('caseMetal', b.dataset.m); CaseBack.layers = {}; this.mark(); this.preview(); Bus.emit('ach', 'bespoke'); Snd.click(); });
    $$('#bs-strap button', el).forEach(b => b.onclick = () => { setSetting('strap', b.dataset.s); this.mark(); this.preview(); Bus.emit('ach', 'bespoke'); Snd.click(); });
    Bus.on('setting:theme', () => { if ($('#bs-cv') && App.cur >= 0 && MODES[App.cur].id === 'bespoke') this.preview(); }); this.mark();
  },
  mark() { $$('#bs-case button').forEach(b => { const on = b.dataset.m === (Settings.caseMetal || 'auto'); b.classList.toggle('on', on); b.setAttribute('aria-checked', on); }); $$('#bs-strap button').forEach(b => { const on = b.dataset.s === Settings.strap; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); }); },
  preview() { const cv = $('#bs-cv'); if (!cv || !cv.clientWidth) return; clearTimeout(this._p); this._p = setTimeout(() => Showcase.preview(cv), 30); },
  show() { requestAnimationFrame(() => this.preview()); }
});

/* ——— IX. Engraving studio ——— */
MODES.push({
  id: 'engrave', page: 2, name: 'Incisione', label: 'Engraving', kicker: 'Salone IX', icon: 'engrave', sub: 'Have the case back engraved. The maker’s mark stays on top; your words go around the bottom.',
  build(el) {
    const E = Settings.engrave || {};
    el.innerHTML = `<canvas id="en-cv" class="en-cv" aria-label="Close-up of the engraved case back"></canvas>
      <label class="lbl" for="en-text">Inscription</label><input type="text" id="en-text" maxlength="34" placeholder="for a mind of refined taste" value="${esc(E.text || '')}">
      <label class="lbl">Style</label><div class="seg" id="en-font"><button data-v="script">Copperplate script</button><button data-v="roman">Roman capitals</button><button data-v="type">Typewriter</button></div>
      <label class="lbl" for="en-date">Dedication <small style="text-transform:none;letter-spacing:0;font-family:var(--serif);color:var(--ivory-d)">(optional, replaces the serial number)</small></label>
      <div class="hms"><input type="text" id="en-date" maxlength="26" placeholder="e.g. 27 · IX · MMXXVI" value="${esc(E.date || '')}" style="flex:1"><button class="chip" id="en-today" type="button">Today, in Roman</button></div>
      <div class="btn-row"><button class="btn primary" id="en-go">Engrave it</button><button class="btn" data-act="flip">Turn the watch over</button><button class="btn ghost" id="en-orig">Restore the original</button></div>
      <p class="fine">Up to 34 characters. Long inscriptions are set a little smaller so they fit the arc. The preview updates as you type; nothing is cut until you press <em>Engrave it</em>.</p>`;
    this.font = E.font || 'script';
    $$('#en-font button', el).forEach(b => b.onclick = () => { this.font = b.dataset.v; this.mark(); this.live(); });
    ['#en-text', '#en-date'].forEach(s => $(s, el).oninput = () => this.live());
    $('#en-today', el).onclick = () => { const d = new Date(), R = (n) => { const v = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]; let s = ''; v.forEach(([a, b]) => { while (n >= a) { s += b; n -= a; } }); return s; }; $('#en-date').value = `${d.getDate()} · ${R(d.getMonth() + 1)} · ${R(d.getFullYear())}`; this.live(); };
    $('#en-go', el).onclick = () => this.commit();
    $('#en-orig', el).onclick = () => { $('#en-text').value = ''; $('#en-date').value = ''; this.font = 'script'; this.mark(); this.commit(true); };
    this.mark();
  },
  mark() { $$('#en-font button').forEach(b => b.classList.toggle('on', b.dataset.v === this.font)); },
  val() { return { text: $('#en-text').value.trim(), font: this.font, date: $('#en-date').value.trim() }; },
  live() { Settings._engravePreview = this.val(); this.draw(); },
  commit(orig) {
    const old = this.snap(); const v = this.val(); setSetting('engrave', v); delete Settings._engravePreview; CaseBack.layers = {};
    this.anim = { t0: performance.now(), old }; if (!orig && v.text && v.text.toLowerCase() !== 'for a mind of refined taste') Bus.emit('ach', 'engrave');
    toast(orig ? 'The original inscription, restored' : 'Engraved. It will outlast us both.'); Snd.ensure(); if (Snd.ctx) { for (let k = 0; k < 14; k++) Snd.tick(0.05 + Math.random() * 0.06); }
  },
  snap() { const cv = $('#en-cv'); if (!cv || !cv.width) return null; const c = document.createElement('canvas'); c.width = cv.width; c.height = cv.height; c.getContext('2d').drawImage(cv, 0, 0); return c; },
  show() { Settings._engravePreview = null; requestAnimationFrame(() => this.draw()); },
  hide() { delete Settings._engravePreview; CaseBack.layers = {}; },
  draw() {
    const cv = $('#en-cv'); if (!cv || !cv.clientWidth) return; const d = Math.min(devicePixelRatio || 1, 2), W = cv.clientWidth, H = cv.clientHeight; cv.width = Math.round(W * d); cv.height = Math.round(H * d);
    CaseBack.layers = {}; CaseBack.render(new Date()); const src = CaseBack.cv, cw = CaseBack.W, R = CaseBack.R, dp = CaseBack.dpr;
    const x = cv.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); const bg = x.createRadialGradient(cv.width / 2, cv.height, 0, cv.width / 2, cv.height, cv.width * 0.8); bg.addColorStop(0, '#1d1814'); bg.addColorStop(1, '#0a0908'); x.fillStyle = bg; x.fillRect(0, 0, cv.width, cv.height);
    // crop the lower two thirds of the case back so both the inscription (bottom) and the dedication (right) are in view
    const sw = R * 2.36, sh = sw * cv.height / cv.width, sx = cw / 2 - sw / 2, sy = cw / 2 + R * 1.1 - sh;
    x.drawImage(src, sx * dp, sy * dp, sw * dp, sh * dp, 0, 0, cv.width, cv.height);
    const g = x.createLinearGradient(0, 0, 0, cv.height); g.addColorStop(0, 'rgba(10,9,8,.9)'); g.addColorStop(0.3, 'rgba(10,9,8,0)'); x.fillStyle = g; x.fillRect(0, 0, cv.width, cv.height);
  },
  frame() {
    if (!this.anim) return; const cv = $('#en-cv'); if (!cv) return; const u = (performance.now() - this.anim.t0) / 1600;
    if (u >= 1) { this.anim = null; this.draw(); return; }
    this.draw(); const x = cv.getContext('2d'), W = cv.width, H = cv.height;
    // reveal: the old engraving is covered by the new one sweeping from right to left, led by a bright burin spark
    if (this.anim.old) { x.save(); x.beginPath(); x.rect(0, 0, W * (1 - u), H); x.clip(); x.drawImage(this.anim.old, 0, 0); x.restore(); }
    const px = W * (1 - u), py = H * (0.55 + 0.3 * Math.sin(u * Math.PI)); const sg = x.createRadialGradient(px, py, 0, px, py, 26 * (devicePixelRatio || 1));
    sg.addColorStop(0, 'rgba(255,250,230,1)'); sg.addColorStop(0.3, 'rgba(255,220,150,.6)'); sg.addColorStop(1, 'rgba(255,200,120,0)'); x.fillStyle = sg; x.beginPath(); x.arc(px, py, 26 * (devicePixelRatio || 1), 0, TAU); x.fill();
    for (let k = 0; k < 6; k++) { x.fillStyle = 'rgba(255,235,190,.8)'; x.fillRect(px + (Math.random() - 0.3) * 30, py + (Math.random() - 0.5) * 24, 2, 2); }
  }
});
// engraving() honours the live preview while typing
{ const orig = CaseBack.engraving.bind(CaseBack); CaseBack.engraving = function () { const p = Settings._engravePreview; if (p) { const e = { text: (p.text || '').trim() || 'for a mind of refined taste', font: p.font || 'script', date: (p.date || '').trim() }; return e; } return orig(); }; }

/* ——— X. Ambience ——— */
MODES.push({
  id: 'ambience', page: 2, name: 'Ambiente', label: 'Ambience', kicker: 'Salone X', icon: 'ambience', sub: 'A soundscape mixer. Every sound is synthesized as you listen: no recordings, and no two minutes alike.',
  build(el) {
    const icons = { cell: 'M4 20V6l8-3 8 3v14M8 20v-8h8v8M10 12v8M14 12v8', rain: 'M7 14a4 4 0 0 1 .5-8 5 5 0 0 1 9.5 1.5A3.5 3.5 0 0 1 17 14zM8 17l-1 3M12 17l-1 3M16 17l-1 3', candle: 'M10 10h4v11h-4zM12 3c2 2.5 2 4.5 0 6-2-1.5-2-3.5 0-6z', harpsi: 'M3 18h18M5 18V8l14-2v12M8 11v7M11 10.5v7.5M14 10v8', tick: 'M12 3v4M7 21h10M9 7h6l1 14H8zM12 11v4' };
    el.innerHTML = `<canvas id="am-cv" class="am-cv" aria-hidden="true"></canvas>
      <div class="am-list">${Object.entries(Scape.CH).map(([k, n]) => `<label class="am-row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${icons[k]}"/></svg><span>${n}</span><input type="range" min="0" max="1" step="0.01" data-ch="${k}" aria-label="${n} volume" value="${Scape.levels[k]}"><i class="am-lv" id="am-lv-${k}"></i></label>`).join('')}</div>
      <div class="presets" style="justify-content:flex-start;margin-top:12px"><button class="chip" data-p="cell">Cell block, after hours</button><button class="chip" data-p="rain">Rain in Florence</button><button class="chip" data-p="study">Candlelit study</button><button class="chip" data-p="off">Silence</button></div>
      <p class="fine">The cell hums at 60 Hz with a draught and the odd distant drip; the rain is shaped noise with individual droplets; the candle flickers and spits; the longcase clock ticks once a second; the harpsichord composes as it goes. The mix is remembered, but sound only starts after you touch something, as browsers require.</p>`;
    $$('input[data-ch]', el).forEach(s => s.oninput = () => Scape.set(s.dataset.ch, +s.value));
    const P = { cell: { cell: 0.7, rain: 0, candle: 0, harpsi: 0, tick: 0.35 }, rain: { cell: 0, rain: 0.75, candle: 0.3, harpsi: 0.3, tick: 0 }, study: { cell: 0, rain: 0.15, candle: 0.7, harpsi: 0.4, tick: 0.3 }, off: { cell: 0, rain: 0, candle: 0, harpsi: 0, tick: 0 } };
    $$('[data-p]', el).forEach(b => b.onclick = () => { Object.entries(P[b.dataset.p]).forEach(([k, v]) => { Scape.set(k, v); const s = $(`input[data-ch="${k}"]`); if (s) s.value = v; }); toast(b.textContent); });
  },
  show() { $$('#panel input[data-ch]').forEach(s => s.value = s.dataset.ch === 'harpsi' ? (Player.playing ? Settings.musicVol / 0.9 : 0) : Scape.levels[s.dataset.ch]); },
  frame() {
    const cv = $('#am-cv'); if (!cv || !cv.clientWidth) return; const d = Math.min(devicePixelRatio || 1, 2), W = cv.clientWidth, H = cv.clientHeight; if (cv.width !== Math.round(W * d)) { cv.width = Math.round(W * d); cv.height = Math.round(H * d); }
    const x = cv.getContext('2d'); x.setTransform(d, 0, 0, d, 0, 0); x.clearRect(0, 0, W, H); x.fillStyle = 'rgba(0,0,0,.28)'; roundRect(x, 0, 0, W, H, 10); x.fill();
    x.strokeStyle = 'rgba(200,169,106,.12)'; x.beginPath(); x.moveTo(0, H / 2); x.lineTo(W, H / 2); x.stroke();
    const an = Scape.an; if (!an) { x.fillStyle = 'rgba(236,228,210,.4)'; x.font = 'italic 14px "Cormorant Garamond", serif'; x.textAlign = 'center'; x.fillText('Raise a slider to begin', W / 2, H / 2 - 8); return; }
    const buf = this.buf || (this.buf = new Uint8Array(an.fftSize)); an.getByteTimeDomainData(buf);
    const fb = this.fb || (this.fb = new Uint8Array(an.frequencyBinCount)); an.getByteFrequencyData(fb);
    for (let i = 0; i < 64; i++) { const v = fb[Math.floor(Math.pow(i / 64, 1.8) * fb.length * 0.7)] / 255; x.fillStyle = `rgba(179,32,42,${0.15 + v * 0.4})`; x.fillRect(i * W / 64 + 1, H - v * H * 0.9, W / 64 - 2, v * H * 0.9); }
    x.beginPath(); for (let i = 0; i < buf.length; i++) { const px = i / buf.length * W, py = H / 2 + (buf[i] - 128) / 128 * H * 1.4; i ? x.lineTo(px, py) : x.moveTo(px, py); }
    x.strokeStyle = '#d8b36a'; x.lineWidth = 1.4; x.shadowColor = 'rgba(216,179,106,.6)'; x.shadowBlur = 6; x.stroke(); x.shadowBlur = 0;
    Object.keys(Scape.CH).forEach(k => { const e = $('#am-lv-' + k); if (e) { const on = k === 'harpsi' ? Player.playing : Scape.levels[k] > 0; e.classList.toggle('on', on); } });
  }
});

/* ——— XI. Nightstand ——— */
MODES.push({
  id: 'nightstand', page: 2, name: 'Comodino', label: 'Nightstand', kicker: 'Salone XI', icon: 'night', sub: 'A dim, full-screen bedside clock that keeps its glow and its manners. It can also start by itself when the watch is left alone.',
  build(el) {
    el.innerHTML = `<div class="ns-prev"><div class="ns-glow"><b id="ns-t">--:--</b><small>CINCO CORPORATION</small></div></div>
      <div class="btn-row"><button class="btn primary" id="ns-go">Place it on the nightstand</button></div>
      <label class="lbl">Face</label><div class="seg" id="ns-style"><button data-v="analog">Luminous hands</button><button data-v="digital">Numerals only</button></div>
      <label class="lbl">Brightness <b id="ns-dimv"></b></label><input type="range" id="ns-dim" min="0.2" max="1" step="0.05" aria-label="Nightstand brightness">
      <label class="lbl">Start by itself after</label><div class="seg" id="ns-idle"><button data-v="0">Never</button><button data-v="1">1 min</button><button data-v="3">3 min</button><button data-v="5">5 min</button><button data-v="10">10 min</button></div>
      <p class="fine">Press <kbd>Z</kbd> from anywhere to go straight to the nightstand. Any tap, key press or deliberate mouse movement wakes the watch. The clock drifts a little every half minute so nothing burns into the screen. Alarms and timers still ring.</p>`;
    $('#ns-go', el).onclick = () => Night.start(true);
    $$('#ns-style button', el).forEach(b => b.onclick = () => { setSetting('nightStyle', b.dataset.v); this.mark(); });
    $$('#ns-idle button', el).forEach(b => b.onclick = () => { setSetting('idleMins', +b.dataset.v); this.mark(); toast(+b.dataset.v ? `The nightstand starts after ${b.dataset.v} idle minute${b.dataset.v === '1' ? '' : 's'}` : 'The nightstand waits to be asked'); });
    $('#ns-dim', el).value = Settings.nightDim; $('#ns-dim', el).oninput = (e) => { setSetting('nightDim', +e.target.value); this.mark(); };
    this.mark();
  },
  mark() { $$('#ns-style button').forEach(b => b.classList.toggle('on', b.dataset.v === Settings.nightStyle)); $$('#ns-idle button').forEach(b => b.classList.toggle('on', +b.dataset.v === +Settings.idleMins)); $('#ns-dimv').textContent = Math.round(Settings.nightDim * 100) + '%'; $('.ns-glow').style.opacity = Settings.nightDim; },
  tick(now) { const t = $('#ns-t'); if (t) t.textContent = fmtClock(now); }
});

/* ——— XII. Vetrina: product shot, share, install ——— */
MODES.push({
  id: 'vetrina', page: 2, name: 'Vetrina', label: 'Showcase', kicker: 'Salone XII', icon: 'vetrina', sub: 'The shop window: export a catalogue photograph of your configuration, and install the watch as an app.',
  build(el) {
    el.innerHTML = `<div class="vt-frame"><img id="vt-img" alt="Catalogue photograph of your configured watch"><div class="vt-busy" id="vt-busy">Developing the photograph…</div></div>
      <div class="btn-row"><button class="btn primary" id="vt-dl">Download PNG (1800 × 2400)</button><button class="btn" id="vt-share" hidden>Share…</button><button class="btn ghost" id="vt-re">Retake</button></div>
      <div class="rule"></div><div class="kicker">Install</div>
      <p class="vt-inst" id="vt-inst"></p><div class="btn-row"><button class="btn" id="vt-install" hidden>Install The Lecter</button></div>
      <p class="fine">Once installed (or after one visit), the watch works offline: every font, sound and texture is made or stored locally. On iPhone and iPad, use Safari’s Share menu → <em>Add to Home Screen</em>.</p>`;
    $('#vt-dl', el).onclick = () => { const c = this.shot || (this.shot = Showcase.shot()); downloadDataURL(c.toDataURL('image/png'), 'cinco-corporation-the-lecter.png'); toast('Catalogue photograph saved'); Bus.emit('ach', 'catalogue'); };
    $('#vt-re', el).onclick = () => { this.shot = null; this.take(); };
    const sh = $('#vt-share', el); if (navigator.canShare && navigator.share) sh.hidden = false;
    sh.onclick = () => { const c = this.shot || (this.shot = Showcase.shot()); c.toBlob(b => { const f = new File([b], 'the-lecter.png', { type: 'image/png' }); if (navigator.canShare({ files: [f] })) navigator.share({ files: [f], title: 'The Lecter by Cinco Corporation', text: 'My configuration of The Lecter, “Il Dottore” C-1991.' }).then(() => Bus.emit('ach', 'catalogue')).catch(() => {}); else toast('This browser cannot share images; use Download instead.'); }, 'image/png'); };
    $('#vt-install', el).onclick = async () => { const p = App.installPrompt; if (!p) return; p.prompt(); try { const r = await p.userChoice; toast(r.outcome === 'accepted' ? 'Installed. It will be waiting on your home screen.' : 'Perhaps another time'); } catch (e) {} App.installPrompt = null; this.inst(); };
    Bus.on('install', () => this.inst());
  },
  inst() {
    const b = $('#vt-install'), p = $('#vt-inst'); if (!b) return; const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    b.hidden = !App.installPrompt;
    p.innerHTML = standalone ? 'Running as an installed app. Well chosen.' : App.installPrompt ? 'This browser can install the watch as an app with its own icon and window.' : location.protocol.startsWith('http') ? 'If your browser offers “Install app” or “Add to Home Screen” in its menu, the watch will open in its own window and work offline.' : 'Installation needs the watch to be served over https (as it is on the live site).';
    p.innerHTML += App.swReady ? ' <span class="ok">✓ Offline copy ready.</span>' : '';
  },
  take() { const img = $('#vt-img'); $('#vt-busy').classList.add('show'); setTimeout(() => { try { this.shot = Showcase.shot(); img.src = this.shot.toDataURL('image/jpeg', 0.86); } finally { $('#vt-busy').classList.remove('show'); } }, 60); },
  show() { this.shot = null; this.take(); this.inst(); }
});

/* ——— XIII. Secrets & achievements ——— */
MODES.push({
  id: 'secrets', page: 2, name: 'Segreti', label: 'Secrets', kicker: 'Salone XIII', icon: 'secrets', sub: 'Achievements, and a few secrets hidden around the watch. Some are in plain sight.',
  build(el) {
    el.innerHTML = `<div class="ac-head"><b id="ac-n"></b><div class="meter"><span id="ac-bar"></span></div></div><ul class="ac-grid" id="ac-grid"></ul>
      <div class="btn-row"><button class="btn ghost" id="ac-reset">Forget all achievements</button></div>
      <p class="fine">Hints are deliberately vague. The watch prefers you to find things out for yourself.</p>`;
    $('#ac-reset', el).onclick = (e) => { const b = e.currentTarget; if (b.dataset.sure) { Ach.reset(); b.textContent = 'Forget all achievements'; delete b.dataset.sure; toast('Forgotten. Mostly.'); } else { b.dataset.sure = 1; b.textContent = 'Press again to confirm'; setTimeout(() => { delete b.dataset.sure; b.textContent = 'Forget all achievements'; }, 3000); } };
    Bus.on('ach:changed', () => this.render()); this.render();
  },
  render() {
    const n = Ach.count(); $('#ac-n').textContent = `${n} of ${ACH.length} discovered`; $('#ac-bar').style.width = (n / ACH.length * 100) + '%';
    $('#ac-grid').innerHTML = ACH.map(([id, t, d, h]) => { const g = Ach.got[id]; return `<li class="${g ? 'got' : ''}" tabindex="0"><i aria-hidden="true">${g ? '✦' : '?'}</i><div><b>${g ? t : 'Undiscovered'}</b><small>${g ? d : h}</small>${g ? `<time>${new Date(g).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</time>` : ''}</div></li>`; }).join('');
  }
});
