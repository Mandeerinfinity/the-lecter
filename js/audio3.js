/* v3 audio: stone-room convolution reverb, compressor + limiter master, body-resonant harpsichord,
   modal-synthesis mechanical sounds (escapement, ratchet, pushers, detents), beating repeater gongs.
   Everything is computed here at first use and cached as AudioBuffers; nothing is sampled or downloaded. */
'use strict';
(() => {
  const baseHarpsi = Snd.harpsiBuffer;
  /* ——— tiny offline DSP helpers ——— */
  const DSP = {
    // two-pole resonator bank excited by a signal: modes = [[freq, amp, t60], ...]
    modal(sr, len, exc, modes) {
      const out = new Float32Array(len);
      for (const [f, a, t60] of modes) {
        if (f >= sr * 0.45) continue;
        const r = Math.exp(-6.91 / (t60 * sr)), w = 2 * Math.PI * f / sr, c1 = 2 * r * Math.cos(w), c2 = -r * r, g = a * (1 - r) * 4;
        let y1 = 0, y2 = 0; for (let i = 0; i < len; i++) { const y = (i < exc.length ? exc[i] : 0) * g + c1 * y1 + c2 * y2; y2 = y1; y1 = y; out[i] += y; }
      }
      return out;
    },
    burst(sr, ms, seed, shape = 6) { const n = Math.max(2, Math.floor(sr * ms / 1000)), r = mulberry32(seed), e = new Float32Array(n); for (let i = 0; i < n; i++) e[i] = (r() * 2 - 1) * Math.pow(1 - i / n, shape); return e; },
    norm(d, peak) { let m = 0; for (let i = 0; i < d.length; i++) m = Math.max(m, Math.abs(d[i])); const g = peak / (m || 1); for (let i = 0; i < d.length; i++) d[i] *= g; return d; },
    fadeOut(d, n) { n = Math.min(n, d.length); for (let i = 0; i < n; i++) d[d.length - 1 - i] *= i / n; return d; },
    buf(ctx, chans) { const b = ctx.createBuffer(chans.length, chans[0].length, ctx.sampleRate); chans.forEach((c, i) => b.getChannelData(i).set(c)); return b; }
  };

  Object.assign(Snd, {
    DSP, fx: {}, _tt: 0, lastHover: 0,
    ensure() {
      if (this.ctx) { if (this.ctx.state !== 'running' && this.ctx.state !== 'closed') this.ctx.resume().catch(() => {}); return this.ctx; }
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
      let ctx; try { ctx = this.ctx = new AC({ latencyHint: 'interactive' }); } catch (e) { try { ctx = this.ctx = new AC(); } catch (e2) { return null; } }
      // master: gain → glue compressor → brick-wall-ish limiter → speakers
      this.master = ctx.createGain(); this.master.gain.value = Settings.volume;
      const glue = ctx.createDynamicsCompressor(); glue.threshold.value = -20; glue.knee.value = 12; glue.ratio.value = 3; glue.attack.value = 0.006; glue.release.value = 0.22;
      const lim = ctx.createDynamicsCompressor(); lim.threshold.value = -3; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.001; lim.release.value = 0.09;
      const trim = ctx.createGain(); trim.gain.value = 1.15;
      this.master.connect(glue).connect(lim).connect(trim).connect(ctx.destination); this.limiter = lim; this.glue = glue;
      // stone-room reverb (a cellar with vaulted brick): pre-delay, early reflections, darkening tail
      this.verb = ctx.createConvolver(); this.verb.normalize = true; this.verb.buffer = this.stoneRoom(2.8);
      const verbHP = ctx.createBiquadFilter(); verbHP.type = 'highpass'; verbHP.frequency.value = 160;
      const verbGain = ctx.createGain(); verbGain.gain.value = 0.34; this.verb.connect(verbHP).connect(verbGain).connect(this.master);
      // music bus with soundboard colour; sfx bus; dry mechanical bus with a light send
      this.music = ctx.createGain(); this.music.gain.value = Settings.musicVol;
      const body = ctx.createBiquadFilter(); body.type = 'peaking'; body.frequency.value = 520; body.Q.value = 0.9; body.gain.value = 2.5;
      const air = ctx.createBiquadFilter(); air.type = 'highshelf'; air.frequency.value = 6500; air.gain.value = -3;
      this.music.connect(body).connect(air); air.connect(this.master); air.connect(this.verb);
      this.sfx = ctx.createGain(); this.sfx.gain.value = 1; this.sfx.connect(this.master); this.sfx.connect(this.verb);
      this.mech = ctx.createGain(); this.mech.gain.value = 1; this.mech.connect(this.master); const ms = ctx.createGain(); ms.gain.value = 0.18; this.mech.connect(ms).connect(this.verb);
      this.ui = ctx.createGain(); this.ui.gain.value = 0.7; this.ui.connect(this.master);
      this.unlocked = true;
      ctx.onstatechange = () => { if (ctx.state === 'interrupted' || (ctx.state === 'suspended' && !document.hidden)) setTimeout(() => this.resume(), 300); };
      return ctx;
    },
    /* iOS: the context may only start inside a user gesture, and a silent buffer must play once to open the route */
    unlockOnce() {
      if (this._unlocking) return; this._unlocking = true;
      const go = () => {
        const ctx = this.ensure(); if (!ctx) return;
        try { const b = ctx.createBuffer(1, 1, 22050), s = ctx.createBufferSource(); s.buffer = b; s.connect(ctx.destination); s.start(0); } catch (e) { /* ignore */ }
        if (ctx.state === 'running') ['touchend', 'pointerdown', 'keydown', 'click'].forEach(ev => removeEventListener(ev, go, true));
      };
      ['touchend', 'pointerdown', 'keydown', 'click'].forEach(ev => addEventListener(ev, go, { capture: true, passive: true }));
      const wake = () => { if (!document.hidden) this.resume(); };
      document.addEventListener('visibilitychange', wake); addEventListener('pageshow', wake); addEventListener('focus', wake);
    },
    resume() { const c = this.ctx; if (c && c.state !== 'running' && c.state !== 'closed') c.resume().catch(() => {}); },
    running() { return !!(this.ctx && this.ctx.state === 'running'); },
    setVolume(v) { if (this.master) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05); },

    /* a generated stone-room impulse response */
    stoneRoom(sec) {
      const ctx = this.ctx, sr = ctx.sampleRate, len = Math.floor(sr * sec), pre = Math.floor(sr * 0.009), L = new Float32Array(len), R = new Float32Array(len), rng = mulberry32(1991);
      // early reflections: walls, floor and vault (ms, gain, pan)
      [[7, .9, -.3], [11, .75, .5], [17, .62, -.6], [23, .55, .2], [29, .5, .7], [37, .42, -.4], [43, .36, .1], [53, .3, -.7], [61, .27, .6], [71, .22, -.2], [83, .18, .4], [97, .14, -.5]]
        .forEach(([ms, g, p]) => { const i = pre + Math.floor(sr * ms / 1000); for (let k = 0; k < 24 && i + k < len; k++) { const v = g * (rng() * 2 - 1) * Math.pow(1 - k / 24, 2); L[i + k] += v * (1 - p) * 0.7; R[i + k] += v * (1 + p) * 0.7; } });
      // diffuse tail: noise, exponential decay, and a lowpass that closes over time (stone absorbs highs faster)
      const T60 = sec * 0.72; for (let c = 0; c < 2; c++) { const d = c ? R : L; let lp = 0, lp2 = 0;
        for (let i = pre + Math.floor(sr * 0.02); i < len; i++) { const t = (i - pre) / sr, env = Math.exp(-6.91 * t / T60) * Math.min(1, t / 0.05), a = 0.08 + 0.8 * Math.exp(-t * 2.4);
          lp += (rng() * 2 - 1 - lp) * a; lp2 += (lp - lp2) * (0.3 + 0.6 * Math.exp(-t * 1.6)); d[i] += lp2 * env * 0.55; } }
      DSP.fadeOut(L, sr * 0.2); DSP.fadeOut(R, sr * 0.2); return DSP.buf(ctx, [L, R]);
    },
    impulse(sec) { return this.stoneRoom(sec || 2.4); },

    /* harpsichord v3: the Karplus–Strong strings from v2, run through soundboard/body modes, with a brighter quill transient */
    harpsiBuffer(midi) {
      const key = 'h3:' + midi; if (this.cache.has(key)) return this.cache.get(key);
      const b0 = baseHarpsi.call(this, midi); this.cache.delete(midi);
      const sr = this.ctx.sampleRate, dry = b0.getChannelData(0), len = dry.length, f = 440 * Math.pow(2, (midi - 69) / 12);
      // soundboard + case body modes (a 2.4 m Italian harpsichord), plus a helmholtz-ish air mode
      const bodyModes = [[118, .6, .5], [212, .9, .35], [340, .7, .3], [505, .8, .26], [760, .6, .2], [1120, .45, .14], [1680, .3, .1], [2450, .22, .07], [3600, .14, .05]];
      const res = DSP.modal(sr, len, dry, bodyModes);
      const out = new Float32Array(len); for (let i = 0; i < len; i++) out[i] = dry[i] * 0.78 + res[i] * 0.22;
      // plectrum: a short, bright, pitch-coloured scrape before the string speaks
      const q = DSP.modal(sr, Math.floor(sr * 0.03), DSP.burst(sr, 2.2, midi * 13, 3), [[Math.min(9000, f * 6.1), .7, .01], [Math.min(11000, f * 9.3), .5, .008], [4200, .4, .006]]);
      for (let i = 0; i < q.length; i++) out[i] += q[i] * 0.35;
      const L = new Float32Array(out), R = new Float32Array(len); // stereo: slight decorrelated body on the right
      for (let i = 0; i < len; i++) R[i] = dry[i] * 0.78 + res[Math.max(0, i - 11)] * 0.24 + (i < q.length ? q[i] * 0.3 : 0);
      DSP.norm(L, 0.62); DSP.norm(R, 0.62);
      const b = DSP.buf(this.ctx, [L, R]); this.cache.set(key, b); return b;
    },
    pluck(midi, when = 0, vel = 0.8, durSec = 0, bus = null) {
      const ctx = this.ensure(); if (!ctx) return;
      const t = Math.max(ctx.currentTime, when || ctx.currentTime);
      const src = ctx.createBufferSource(); src.buffer = this.harpsiBuffer(midi);
      const g = ctx.createGain(); g.gain.value = vel;
      const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      if (pan) { pan.pan.value = clamp((midi - 62) / 44, -0.55, 0.55); src.connect(g).connect(pan).connect(bus || this.music); } else src.connect(g).connect(bus || this.music);
      src.start(t);
      if (durSec > 0) { const off = t + Math.max(0.05, durSec);
        g.gain.setValueAtTime(vel, off); g.gain.exponentialRampToValueAtTime(0.0008, off + 0.1); src.stop(off + 0.14);
        this.play('jack', off, vel * 0.18, bus || this.music, 1 + (midi - 60) / 400); } // the jack drops back and its damper felt lands
      return src;
    },

    /* ——— mechanical sound effects, each rendered once ——— */
    make(name) {
      if (this.fx[name]) return this.fx[name]; const ctx = this.ctx, sr = ctx.sampleRate; let d;
      const M = (ms, exc, modes) => DSP.modal(sr, Math.floor(sr * ms / 1000), exc, modes);
      switch (name) {
        case 'tick': case 'tock': { // escapement: pallet impact, then the escape wheel tooth drop ~5 ms later, on a small case resonance
          const hi = name === 'tick' ? 1 : 0.9;
          d = M(60, DSP.burst(sr, 0.5, name === 'tick' ? 3 : 4), [[3150 * hi, 1, .012], [5480 * hi, .7, .009], [7900 * hi, .35, .006], [1240 * hi, .45, .02], [640, .25, .03]]);
          const drop = M(40, DSP.burst(sr, 0.3, 9), [[4400 * hi, .6, .007], [6900 * hi, .4, .005]]), off = Math.floor(sr * 0.0055);
          for (let i = 0; i < drop.length && i + off < d.length; i++) d[i + off] += drop[i] * 0.45; break; }
        case 'ratchet': // crown winding: click-spring pawl jumping a ratchet tooth
          d = M(45, DSP.burst(sr, 0.35, 21), [[2650, 1, .008], [4100, .8, .006], [6200, .45, .004], [980, .35, .015]]); break;
        case 'pushDown': d = M(70, DSP.burst(sr, 1.2, 31, 3), [[1850, 1, .018], [3300, .6, .012], [520, .5, .03], [7400, .25, .004]]); break;
        case 'pushUp': d = M(50, DSP.burst(sr, 0.6, 33), [[2400, .8, .01], [4600, .5, .007], [760, .3, .02]]); break;
        case 'detent': d = M(40, DSP.burst(sr, 0.4, 41), [[3600, 1, .007], [5900, .55, .005], [1500, .4, .012]]); break;
        case 'jack': d = M(50, DSP.burst(sr, 1.5, 51, 2), [[380, 1, .03], [900, .6, .02], [2100, .35, .01]]); break;
        case 'hover': d = M(35, DSP.burst(sr, 0.25, 61), [[5200, 1, .006], [8300, .4, .004]]); break;
        case 'select': { d = M(140, DSP.burst(sr, 0.5, 71), [[1320, 1, .09], [2640, .35, .05], [3960, .18, .03], [5200, .3, .006]]); break; }
        case 'whoosh': { // case flip: air past the case, a band-passed noise sweep with a soft thump
          const n = Math.floor(sr * 0.5), rng = mulberry32(81); d = new Float32Array(n); let b0 = 0, b1 = 0;
          for (let i = 0; i < n; i++) { const t = i / n, env = Math.sin(Math.PI * Math.pow(t, 0.7)) ** 2, fc = 300 + 2600 * Math.sin(Math.PI * t), w = 2 * Math.PI * fc / sr, r = 0.94, x = rng() * 2 - 1;
            const y = x * (1 - r) + 2 * r * Math.cos(w) * b0 - r * r * b1; b1 = b0; b0 = y; d[i] = y * env; }
          const th = M(120, DSP.burst(sr, 3, 83, 2), [[95, 1, .08], [160, .6, .05]]), o = Math.floor(n * 0.78); for (let i = 0; i < th.length && o + i < n; i++) d[o + i] += th[i] * 0.5; break; }
        default: return null;
      }
      DSP.norm(d, 0.9); DSP.fadeOut(d, 64); return (this.fx[name] = DSP.buf(ctx, [d]));
    },
    play(name, when, vel = 0.5, dest, rate = 1, pan = 0) {
      const ctx = this.ctx; if (!ctx || ctx.state !== 'running') return; const b = this.make(name); if (!b) return;
      const s = ctx.createBufferSource(); s.buffer = b; s.playbackRate.value = rate; const g = ctx.createGain(); g.gain.value = vel;
      let n = s.connect(g); if (pan && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = pan; n = n.connect(p); } n.connect(dest || this.mech);
      s.start(Math.max(ctx.currentTime, when || 0));
    },
    tick(vel = 0.12) { this._tt ^= 1; this.play(this._tt ? 'tick' : 'tock', 0, vel * 1.6, this.mech, 1 + (Math.random() - 0.5) * 0.02); },
    click() { this.pusher(); },
    ratchet(vel = 0.5) { this.play('ratchet', 0, vel, this.mech, 0.96 + Math.random() * 0.08, 0.35); },
    pusher(which = 0) { const t = this.ctx ? this.ctx.currentTime : 0; this.play('pushDown', t, 0.55, this.mech, 1, which ? 0.3 : -0.1); this.play('pushUp', t + 0.085, 0.35, this.mech, 1, which ? 0.3 : -0.1); },
    detent(dir = 1) { this.play('detent', 0, 0.42, this.mech, dir > 0 ? 1.04 : 0.96); },
    whoosh(dir = 1) { this.play('whoosh', 0, 0.5, this.sfx, dir > 0 ? 1 : 0.88, dir > 0 ? 0.2 : -0.2); },
    hover() { const n = performance.now(); if (n - this.lastHover < 70) return; this.lastHover = n; this.play('hover', 0, 0.12, this.ui, 0.95 + Math.random() * 0.1); },
    select() { this.play('select', 0, 0.22, this.ui); },

    /* repeater gongs v3: each partial is a pair of slightly mistuned modes, so the note beats and blooms as real wire gongs do */
    gongBuf(freq) {
      const key = 'g' + Math.round(freq); if (this.fx[key]) return this.fx[key];
      const sr = this.ctx.sampleRate, len = Math.floor(sr * 3.4), exc = DSP.burst(sr, 0.9, Math.round(freq), 4);
      const P = [[1, 1, 2.9, 0.9], [2.02, .38, 1.9, 1.7], [2.93, .3, 1.4, 2.3], [4.11, .16, 1.0, 1.2], [5.38, .14, .8, 3.1], [6.97, .07, .5, 2.2], [8.7, .05, .35, 4]];
      const modes = []; P.forEach(([r, a, t, beat]) => { modes.push([freq * r, a, t]); modes.push([freq * r + beat, a * 0.8, t * 0.92]); });
      const L = DSP.modal(sr, len, exc, modes), R = DSP.modal(sr, len, exc, modes.map(([f, a, t], i) => [f * (1 + (i % 2 ? 0.0006 : -0.0004)), a, t]));
      const click = DSP.modal(sr, Math.floor(sr * 0.03), DSP.burst(sr, 0.4, 7), [[5600, 1, .006], [8200, .5, .004]]);
      for (let i = 0; i < click.length; i++) { L[i] += click[i] * 0.12; R[i] += click[i] * 0.1; }
      DSP.norm(L, 0.8); DSP.norm(R, 0.8); DSP.fadeOut(L, sr * 0.3); DSP.fadeOut(R, sr * 0.3);
      return (this.fx[key] = DSP.buf(this.ctx, [L, R]));
    },
    gong(freq, when, vel = 0.5, dest) {
      const ctx = this.ensure(); if (!ctx) return; const t = Math.max(ctx.currentTime, when || ctx.currentTime);
      const s = ctx.createBufferSource(); s.buffer = this.gongBuf(freq); const g = ctx.createGain(); g.gain.value = vel * 1.3; s.connect(g).connect(dest || this.sfx); s.start(t);
    },
    bell(freq, when = 0, vel = 0.5, dur = 3.5) {
      const ctx = this.ensure(); if (!ctx) return; const t = Math.max(ctx.currentTime, when || ctx.currentTime);
      // church-bell partials (hum, prime, tierce, quint, nominal) with gentle beating
      [[0.5, .3, 1.2], [1, 1, 1], [1.183, .35, .7], [1.506, .25, .6], [2, .45, .5], [2.514, .14, .35], [3.01, .09, .25]].forEach(([r, a, dm], i) => {
        const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = freq * r; o2.frequency.value = freq * r + 0.6 + i * 0.3;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vel * a * 0.6, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + dur * dm);
        o.connect(g); o2.connect(g); g.connect(this.sfx); o.start(t); o2.start(t); o.stop(t + dur * dm + 0.05); o2.stop(t + dur * dm + 0.05);
      });
    }
  });

  /* UI sounds + haptics, delegated once for every button in the app */
  Snd.wireUI = () => {
    const sel = 'button, [role=radio], [role=tab], .seg button, .theme-card, .switch, a.btn';
    addEventListener('pointerover', (e) => { if (e.pointerType !== 'mouse' || !Snd.running()) return; const b = e.target.closest && e.target.closest(sel); if (b && b !== Snd._hovEl) { Snd._hovEl = b; Snd.hover(); } else if (!b) Snd._hovEl = null; }, { passive: true });
    addEventListener('click', (e) => { const b = e.target.closest && e.target.closest(sel); if (!b) return; if (Snd.running()) Snd.select(); if (typeof Haptics !== 'undefined') Haptics.tap('select'); }, { passive: true, capture: true });
  };
})();
