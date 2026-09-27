/* Audio engine: Karplus–Strong harpsichord, bells, chimes, reverb. All synthesized; no samples. */
'use strict';
const Snd = {
  ctx: null, master: null, music: null, sfx: null, verb: null, cache: new Map(), unlocked: false,
  ensure() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return this.ctx; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    const ctx = this.ctx = new AC();
    this.master = ctx.createGain(); this.master.gain.value = Settings.volume;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 3;
    this.master.connect(comp).connect(ctx.destination);
    // body resonance + reverb
    this.verb = ctx.createConvolver(); this.verb.buffer = this.impulse(2.6, 2.4);
    const verbGain = ctx.createGain(); verbGain.gain.value = 0.32; this.verb.connect(verbGain).connect(this.master);
    this.music = ctx.createGain(); this.music.gain.value = Settings.musicVol;
    const body = ctx.createBiquadFilter(); body.type = 'peaking'; body.frequency.value = 900; body.Q.value = 0.8; body.gain.value = 3;
    const air = ctx.createBiquadFilter(); air.type = 'highshelf'; air.frequency.value = 5000; air.gain.value = -4;
    this.music.connect(body).connect(air); air.connect(this.master); air.connect(this.verb);
    this.sfx = ctx.createGain(); this.sfx.gain.value = 1; this.sfx.connect(this.master); this.sfx.connect(this.verb);
    this.unlocked = true;
    return ctx;
  },
  setVolume(v) { if (this.master) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05); },
  setMusicVol(v) { if (this.music) this.music.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05); },
  impulse(sec, decay) {
    const ctx = this.ctx, sr = ctx.sampleRate, len = Math.floor(sr * sec), b = ctx.createBuffer(2, len, sr);
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c); let lp = 0;
      for (let i = 0; i < len; i++) {
        const t = i / len; lp = lp * 0.6 + (Math.random() * 2 - 1) * 0.4;
        d[i] = (i < sr * 0.012 ? 0 : lp) * Math.pow(1 - t, decay) * (0.9 + 0.1 * Math.sin(i * 0.002 + c));
      }
    }
    return b;
  },
  /* One harpsichord note as an AudioBuffer: two unison 8' strings + a 4' octave string, KS with allpass tuning. */
  harpsiBuffer(midi) {
    const key = midi; if (this.cache.has(key)) return this.cache.get(key);
    const ctx = this.ctx, sr = ctx.sampleRate, f = 440 * Math.pow(2, (midi - 69) / 12);
    const dur = clamp(4.2 - (midi - 36) * 0.045, 1.1, 4.2), len = Math.floor(sr * dur);
    const out = new Float32Array(len);
    const ks = (freq, amp, T60, bright, pos, seed) => {
      const rng = mulberry32(seed);
      const fd = (1 - bright) * 0.5, total = sr / freq - fd;
      let N = Math.floor(total - 0.1); if (N < 2) N = 2; const d = total - N, C = (1 - d) / (1 + d);
      const buf = new Float32Array(N), exc = new Float32Array(N);
      for (let i = 0; i < N; i++) exc[i] = rng() * 2 - 1;
      const p = Math.max(1, Math.round(N * pos));
      let lpf = 0;
      for (let i = 0; i < N; i++) { const v = exc[i] - exc[(i + p) % N]; lpf = lpf * 0.15 + v * 0.85; buf[i] = lpf; }
      const rho = Math.pow(10, -3 / (T60 * freq));
      let idx = 0, prev = 0, apx = 0, apy = 0;
      for (let i = 0; i < len; i++) {
        const x = buf[idx]; out[i] += x * amp;
        const lf = rho * (bright * x + (1 - bright) * 0.5 * (x + prev)); prev = x;
        const ap = C * lf + apx - C * apy; apx = lf; apy = ap;
        buf[idx] = ap; if (++idx >= N) idx = 0;
      }
    };
    const T = clamp(7.5 - (midi - 36) * 0.09, 1.4, 7.5);
    ks(f, 0.55, T, 0.28, 0.11, midi * 7 + 1);
    ks(f * Math.pow(2, 2.2 / 1200), 0.42, T * 0.92, 0.3, 0.13, midi * 7 + 2);
    if (midi < 84) ks(f * 2 * Math.pow(2, -1.5 / 1200), 0.22, T * 0.6, 0.35, 0.09, midi * 7 + 3);
    // quill "pluck" click
    const rng = mulberry32(midi + 99); let hp = 0, last = 0;
    for (let i = 0; i < sr * 0.006; i++) { const n = rng() * 2 - 1; hp = 0.7 * (hp + n - last); last = n; out[i] += hp * 0.25 * (1 - i / (sr * 0.006)); }
    // DC block + normalize + fade tail
    let x1 = 0, y1 = 0, peak = 0;
    for (let i = 0; i < len; i++) { const y = out[i] - x1 + 0.995 * y1; x1 = out[i]; y1 = y; out[i] = y; peak = Math.max(peak, Math.abs(y)); }
    const fade = Math.floor(sr * 0.15), g = 0.6 / (peak || 1);
    for (let i = 0; i < len; i++) out[i] *= g * (i > len - fade ? (len - i) / fade : 1);
    const b = ctx.createBuffer(1, len, sr); b.copyToChannel ? b.copyToChannel(out, 0) : b.getChannelData(0).set(out);
    this.cache.set(key, b); return b;
  },
  pluck(midi, when = 0, vel = 0.8, durSec = 0, bus = null) {
    const ctx = this.ensure(); if (!ctx) return;
    const t = Math.max(ctx.currentTime, when || ctx.currentTime);
    const src = ctx.createBufferSource(); src.buffer = this.harpsiBuffer(midi);
    const g = ctx.createGain(); g.gain.value = vel;
    const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (pan) { pan.pan.value = clamp((midi - 62) / 40, -0.6, 0.6); src.connect(g).connect(pan).connect(bus || this.music); }
    else src.connect(g).connect(bus || this.music);
    src.start(t);
    if (durSec > 0) { // damper falls
      const off = t + Math.max(0.05, durSec);
      g.gain.setValueAtTime(vel, off); g.gain.exponentialRampToValueAtTime(0.0008, off + 0.12); src.stop(off + 0.15);
    }
    return src;
  },
  bell(freq, when = 0, vel = 0.5, dur = 3.5) {
    const ctx = this.ensure(); if (!ctx) return;
    const t = Math.max(ctx.currentTime, when || ctx.currentTime);
    [[1, 1], [2.0, 0.45], [2.76, 0.3], [5.4, 0.16], [8.93, 0.08], [0.5, 0.25]].forEach(([r, a]) => {
      const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = freq * r;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vel * a, t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur / Math.sqrt(r));
      o.connect(g).connect(this.sfx); o.start(t); o.stop(t + dur + 0.1);
    });
  },
  chime(times = 1) { // harpsichord cadence + bell strikes
    const ctx = this.ensure(); if (!ctx) return; const t = ctx.currentTime + 0.05;
    [67, 71, 74, 79, 83].forEach((m, i) => this.pluck(m, t + i * 0.09, 0.7, 0, this.sfx));
    for (let k = 0; k < times; k++) this.bell(523.25, t + 0.6 + k * 1.1, 0.35);
  },
  heartbeat(vel = 0.6) {
    const ctx = this.ensure(); if (!ctx) return; const t = ctx.currentTime;
    [[0, 1], [0.16, 0.7]].forEach(([dt, a]) => {
      const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine';
      o.frequency.setValueAtTime(70, t + dt); o.frequency.exponentialRampToValueAtTime(38, t + dt + 0.12);
      g.gain.setValueAtTime(0.0001, t + dt); g.gain.exponentialRampToValueAtTime(vel * a, t + dt + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dt + 0.18); o.connect(g).connect(this.master); o.start(t + dt); o.stop(t + dt + 0.2);
    });
  },
  tick(vel = 0.12) {
    const ctx = this.ctx; if (!ctx || ctx.state !== 'running') return; const t = ctx.currentTime;
    const len = Math.floor(ctx.sampleRate * 0.012), b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 6);
    const s = ctx.createBufferSource(); s.buffer = b; const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 4200; f.Q.value = 3;
    const g = ctx.createGain(); g.gain.value = vel; s.connect(f).connect(g).connect(this.master); s.start(t);
  },
  click() { this.tick(0.25); }
};

/* ——— Procedural Baroque composer ——— */
const Composer = (() => {
  const MAJ = [0, 2, 4, 5, 7, 9, 11], MIN = [0, 2, 3, 5, 7, 8, 11]; // harmonic minor
  const deg = (tonic, scale, d) => { const o = Math.floor(d / 7), i = ((d % 7) + 7) % 7; return tonic + o * 12 + scale[i]; };
  const triad = (root) => [root, root + 2, root + 4];
  const nearest = (tonic, scale, target, degs) => { // pick degree from degs (any octave) nearest to midi target
    let best = null, bd = 1e9;
    for (const d of degs) for (let o = -3; o <= 3; o++) { const m = deg(tonic, scale, d + o * 7); const dd = Math.abs(m - target); if (dd < bd) { bd = dd; best = d + o * 7; } }
    return best;
  };
  function aria(seed) { // Sarabande-style aria in G major, 3/4
    const r = mulberry32(seed), tonic = 55, S = MAJ, ev = [];
    const prog = [0, 4, 5, 2, 3, 0, 1, 4, 0, 3, 6, 5, 1, 4, 4, 0, 5, 1, 4, 0, 3, 1, 4, 0];
    let md = 11; // melody degree (around B4)
    prog.forEach((c, bar) => {
      const t0 = bar * 3, tones = triad(c);
      ev.push({ t: t0, m: deg(tonic, S, c - 7), d: 2.8, v: 0.62 });
      ev.push({ t: t0 + 1, m: deg(tonic, S, c + 2 - 7 + (r() < 0.5 ? 0 : 2)), d: 1.8, v: 0.4 });
      const cad = bar % 8 === 7;
      const rhythms = cad ? [[0, 3]] : [[0, 1.5, 2], [0, 1, 3], [0, 1, 2, 2.5], [0, 2, 2.5], [0, 0.5, 1, 2]];
      const rh = pick(rhythms, r);
      rh.slice(0, -1).forEach((st, k) => {
        const len = rh[k + 1] - st, strong = st === 0 || st === 1;
        const target = deg(tonic, S, md) + (r() - 0.45) * 5;
        let nd = strong ? nearest(tonic, S, target, tones) : md + (r() < 0.5 ? 1 : -1);
        nd = clamp(nd, 8, 17); md = nd;
        const m = deg(tonic, S, nd);
        if (cad && k === 0) { // trill ornament on cadence
          for (let q = 0; q < 6; q++) ev.push({ t: t0 + q * 0.125, m: q % 2 ? deg(tonic, S, nd + 1) : m, d: 0.12, v: 0.5 });
          ev.push({ t: t0 + 0.75, m, d: 2.2, v: 0.6 });
        } else ev.push({ t: t0 + st, m, d: len * 0.95, v: strong ? 0.62 : 0.5 });
      });
    });
    return { ev, beats: prog.length * 3, bpm: 58, name: 'Aria da capo', key: 'G major' };
  }
  function invention(seed) { // two-part invention in D minor, 4/4, sixteenths
    const r = mulberry32(seed), tonic = 62, S = MIN, ev = [];
    const prog = [0, 3, 6, 2, 5, 1, 4, 0, 0, 4, 0, 3, 1, 4, 4, 0];
    const motifA = [0, 1, 2, 3, 1, 2, 0, 4, 4, 3, 2, 1, 2, 1, 0, -1];
    const motifB = [4, 3, 2, 1, 2, 3, 4, 7, 5, 4, 3, 2, 3, 2, 1, 0];
    prog.forEach((c0, bar) => {
      const c = c0 > 3 ? c0 - 7 : c0, t0 = bar * 4, mot = (bar + (seed & 1)) % 2 ? motifB : motifA, lhLead = bar % 4 === 2;
      const rhOct = 0, lhOct = -14;
      if (!lhLead) {
        mot.forEach((d, i) => ev.push({ t: t0 + i * 0.25, m: deg(tonic, S, c + d + rhOct), d: 0.23, v: i % 4 === 0 ? 0.6 : 0.46 }));
        [0, 4, 7, 4].forEach((d, i) => ev.push({ t: t0 + i, m: deg(tonic, S, c + d + lhOct + (i === 2 && r() < 0.4 ? -7 : 0)), d: 0.9, v: 0.5 }));
      } else {
        mot.forEach((d, i) => ev.push({ t: t0 + i * 0.25, m: deg(tonic, S, c + d + lhOct + 7), d: 0.23, v: i % 4 === 0 ? 0.58 : 0.44 }));
        [4, 2, 7, 4].forEach((d, i) => ev.push({ t: t0 + i, m: deg(tonic, S, c + d + 7), d: 0.9, v: 0.5 }));
      }
    });
    ev.push({ t: prog.length * 4, m: deg(tonic, S, -14), d: 2, v: 0.6 }, { t: prog.length * 4, m: deg(tonic, S, 0), d: 2, v: 0.6 }, { t: prog.length * 4, m: deg(tonic, S, 2) + 1, d: 2, v: 0.5 });
    return { ev, beats: prog.length * 4 + 3, bpm: 76, name: 'Invention in D minor', key: 'D minor' };
  }
  function prelude(seed) { // arpeggiated prelude with voice-led progression, C major
    const r = mulberry32(seed), tonic = 48, S = MAJ, ev = [];
    const next = { 0: [3, 4, 5, 1, 0], 1: [4, 6], 2: [5, 3], 3: [4, 1, 0, 6], 4: [0, 5, 0], 5: [1, 3, 2], 6: [0, 2] };
    let c = 0, prog = [0];
    for (let i = 1; i < 23; i++) { c = pick(next[c], r); prog.push(c); }
    prog.push(3, 4, 4, 0);
    let voices = [7, 9, 11]; // upper voices as degrees
    prog.forEach((c, bar) => {
      const t0 = bar * 2; const tones = triad(c).concat(triad(c).map(x => x + 7));
      voices = voices.map(v => { let best = v, bd = 99; for (const t of tones) for (let o = -1; o <= 2; o++) { const d = t + o * 7 - 7; if (d < 6 || d > 16) continue; const dd = Math.abs(d - v) + (voices.includes(d) ? 0.6 : 0); if (dd < bd) { bd = dd; best = d; } } return best; }).sort((a, b) => a - b);
      if (new Set(voices).size < 3) voices = [voices[0], voices[0] + 2, voices[0] + 4];
      const bass = deg(tonic, S, c > 4 ? c - 7 : c), ten = deg(tonic, S, (c > 4 ? c - 7 : c) + 4);
      const up = voices.map(v => deg(tonic, S, v));
      for (let h = 0; h < 2; h++) {
        const b = t0 + h;
        const pat = [bass, ten, up[0], up[1], up[2], up[0], up[1], up[2]];
        pat.forEach((m, i) => ev.push({ t: b + i * 0.125, m, d: i < 2 ? 0.95 - i * 0.125 : 0.3, v: i === 0 ? 0.62 : 0.46 }));
      }
    });
    const end = prog.length * 2; [0, 7, 9, 11, 14].forEach((d, i) => ev.push({ t: end + i * 0.06, m: deg(tonic, S, d), d: 3, v: 0.55 }));
    return { ev, beats: end + 4, bpm: 66, name: 'Prelude in C', key: 'C major' };
  }
  function passacaglia(seed) { // ground bass in C minor with growing variations, 3/4
    const r = mulberry32(seed), tonic = 48, S = MIN, ev = [];
    const ground = [0, -1, -2, -3, -4, -5, -3, -3]; // lament tetrachord (degrees) then cadence
    const chords = [0, 4, 3, 4, 3, 5, 1, 4];
    for (let cyc = 0; cyc < 4; cyc++) {
      ground.forEach((g, i) => {
        const bar = cyc * 8 + i, t0 = bar * 3, c = chords[i], tones = triad(c).map(x => x + 7);
        ev.push({ t: t0, m: deg(tonic, S, g), d: 2.9, v: 0.62 });
        if (cyc > 0) ev.push({ t: t0, m: deg(tonic, S, g - 7) < 29 ? deg(tonic, S, g) - 12 + 12 : deg(tonic, S, g - 7), d: 2.9, v: 0.35 });
        const up = tones.map(d => deg(tonic, S, d + 7));
        if (cyc === 0) up.forEach((m, k) => ev.push({ t: t0 + 1, m, d: 1.9, v: 0.42 }));
        else if (cyc === 1) [0, 1, 2, 1, 2, 0].forEach((k, j) => ev.push({ t: t0 + j * 0.5, m: up[k] + (j === 3 && r() < 0.5 ? 12 : 0), d: 0.45, v: 0.45 }));
        else if (cyc === 2) for (let j = 0; j < 12; j++) { const dd = tones[j % 3] + 7 + (j % 4 === 3 ? 1 : 0) + Math.floor(j / 6) * 2; ev.push({ t: t0 + j * 0.25, m: deg(tonic, S, dd), d: 0.22, v: j % 4 ? 0.42 : 0.55 }); }
        else { for (let j = 0; j < 9; j++) { const dd = tones[j % 3] + 7 + (j >= 6 ? 3 : j >= 3 ? 1 : 0); ev.push({ t: t0 + j / 3, m: deg(tonic, S, dd), d: 0.3, v: j % 3 ? 0.44 : 0.58 }); } }
      });
    }
    const end = 32 * 3; [0, 7, 9 + 0, 14].forEach(d => ev.push({ t: end, m: deg(tonic, S, d) + (d === 9 ? 1 : 0), d: 3.5, v: 0.55 })); // Picardy third
    return { ev, beats: end + 4, bpm: 64, name: 'Passacaglia in C minor', key: 'C minor' };
  }
  function toccata(seed) { // bright alarm piece
    const tonic = 50, S = MAJ, ev = [], prog = [0, 4, 5, 3, 0, 3, 4, 0];
    prog.forEach((c, bar) => {
      for (let i = 0; i < 16; i++) { const d = [0, 2, 4, 7, 9, 7, 4, 2][i % 8] + c + 7; ev.push({ t: bar * 4 + i * 0.25, m: deg(tonic, S, d), d: 0.2, v: i % 4 ? 0.5 : 0.7 }); }
      ev.push({ t: bar * 4, m: deg(tonic, S, c - 7), d: 1.9, v: 0.6 }, { t: bar * 4 + 2, m: deg(tonic, S, c - 3), d: 1.9, v: 0.5 });
    });
    return { ev, beats: prog.length * 4, bpm: 112, name: 'Toccata (Réveil)', key: 'D major' };
  }
  return { pieces: { aria, invention, prelude, passacaglia, toccata } };
})();

/* Look-ahead sequencer */
const Player = {
  piece: null, id: null, seed: 1, playing: false, startAt: 0, idx: 0, timer: null, tempo: 1, loop: true, bus: null,
  active: [], hist: [], onNote: null, onEnd: null,
  load(id, seed = Math.floor(Math.random() * 1e6)) { this.id = id; this.seed = seed; this.piece = Composer.pieces[id](seed); this.piece.ev.sort((a, b) => a.t - b.t); },
  spb() { return 60 / (this.piece.bpm * this.tempo); },
  play(id = this.id, seed) {
    const ctx = Snd.ensure(); if (!ctx) return;
    if (id !== this.id || !this.piece || seed != null) this.load(id, seed);
    this.stop(true); this.playing = true; this.idx = 0; this.startAt = ctx.currentTime + 0.12;
    this.timer = setInterval(() => this.pump(), 40); this.pump(); Bus.emit('music', 'play');
  },
  pump() {
    const ctx = Snd.ctx, spb = this.spb(), horizon = ctx.currentTime + 0.25, ev = this.piece.ev;
    while (this.idx < ev.length) {
      const e = ev[this.idx], at = this.startAt + e.t * spb; if (at > horizon) break;
      Snd.pluck(e.m, at, e.v, e.d * spb, this.bus); const nt = { m: e.m, on: at, off: at + e.d * spb }; this.active.push(nt); this.hist.push(nt); this.idx++;
    }
    const endAt = this.startAt + this.piece.beats * spb;
    if (this.idx >= ev.length && ctx.currentTime > endAt - 0.1) {
      if (this.loop) { this.load(this.id, this.seed + 1); this.idx = 0; this.startAt = endAt + spb; Bus.emit('music', 'variation'); }
      else { this.stop(); if (this.onEnd) this.onEnd(); }
    }
    const now = ctx.currentTime; this.active = this.active.filter(a => a.off + 0.05 > now); if (this.hist.length > 400) this.hist = this.hist.filter(a => a.off > now - 6);
  },
  progress() { if (!this.piece || !this.playing) return 0; return clamp((Snd.ctx.currentTime - this.startAt) / (this.piece.beats * this.spb()), 0, 1); },
  sounding() { if (!Snd.ctx) return []; const n = Snd.ctx.currentTime; return this.active.filter(a => a.on <= n && a.off > n).map(a => a.m); },
  stop(silent) { clearInterval(this.timer); this.timer = null; const was = this.playing; this.playing = false; this.active = []; if (was && !silent) Bus.emit('music', 'stop'); }
};
