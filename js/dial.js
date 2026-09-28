/* The watch head: case, dial, complications and hands rendered on a high-DPI canvas. */
'use strict';
const METALS = {
  steel:  ['#fbfcfd', '#c3c8ce', '#737a83', '#e6e9ec', '#4d535b', '#d8dce0'],
  rose:   ['#ffeadf', '#e0a487', '#93573b', '#f5ccb4', '#62331f', '#e8b69b'],
  bronze: ['#f2d6a6', '#b58b52', '#684824', '#dcb57d', '#3c2812', '#c99c5f'],
  nv:     ['#d9ffd4', '#80b27b', '#2a4828', '#b9e8b4', '#172b16', '#9ed09a'],
  gold:   ['#fff4c9', '#e2bc5f', '#9a7224', '#f6dc8e', '#5a3f0e', '#ebca74'],
  platinum: ['#ffffff', '#dfe3e8', '#a3aab3', '#f3f5f7', '#6f7780', '#e9ecef'],
  dlc:    ['#8a8f96', '#34383e', '#141518', '#5c6168', '#060708', '#454a51']
};
const METAL_NAMES = { steel: 'Polished steel', rose: 'Rose gold', gold: 'Yellow gold', platinum: 'Platinum', dlc: 'Black DLC', bronze: 'Bronze', nv: 'Phosphor steel' };
const THEMES = {
  florence: { name: 'Charcoal Florence', blurb: 'Sunburst charcoal dial, steel case, crimson seconds.', metal: 'steel', dial: ['#46484b', '#141516'], pattern: 'sunburst',
    print: '#ece6d8', printDim: 'rgba(236,230,216,.55)', idx: ['#ffffff', '#858a91'], hand: ['#fafaf8', '#80868d'], lume: '#efe9d2', accent: '#c1272d', sub: ['#303134', '#18191a'], moon: ['#16213f', '#070b18'], numerals: 'baton', bg: '#0c0b0a' },
  crimson: { name: 'Crimson Cell', blurb: 'Oxblood clous-de-Paris dial, rose-gold case, gold Roman numerals.', metal: 'rose', dial: ['#6e1319', '#1e0305'], pattern: 'clous',
    print: '#f3dcb8', printDim: 'rgba(243,220,184,.55)', idx: ['#fff0dc', '#b07a4d'], hand: ['#ffeeda', '#a46d45'], lume: '#fff1d6', accent: '#f2cf93', sub: ['#4a0c10', '#1a0304'], moon: ['#1b1030', '#07040e'], numerals: 'roman', bg: '#0d0606' },
  ivory: { name: 'Bone Ivory', blurb: 'Grand-feu style ivory enamel, painted Roman numerals, blued-steel hands.', metal: 'steel', dial: ['#f6f0e2', '#d6c9ac'], pattern: 'enamel',
    print: '#1d1b18', printDim: 'rgba(29,27,24,.55)', idx: ['#2b2a28', '#050505'], hand: ['#4f76c9', '#0c1a45'], lume: '#2a4fa8', accent: '#1f45a8', sub: ['#efe7d4', '#d9ccb0'], moon: ['#1a2a5c', '#0a1230'], numerals: 'painted', bg: '#0d0c0a' },
  nv: { name: 'Night Vision', blurb: 'Phosphor-green tactical dial seen through an image intensifier.', metal: 'nv', dial: ['#12351a', '#020a04'], pattern: 'grid',
    print: '#aaff9f', printDim: 'rgba(170,255,159,.5)', idx: ['#e6ffe0', '#5fa35a'], hand: ['#e0ffd9', '#4f8f4a'], lume: '#c8ffbd', accent: '#e8ffe0', sub: ['#0b2410', '#020803'], moon: ['#06200b', '#010702'], numerals: 'baton', bg: '#020603', nv: true },
  moth: { name: 'Moth Wing', blurb: 'Scaled wing-texture dial in umber and ochre, bronze case.', metal: 'bronze', dial: ['#7a5d3b', '#24180c'], pattern: 'wing',
    print: '#f1e3c2', printDim: 'rgba(241,227,194,.55)', idx: ['#fff3d2', '#9c7640'], hand: ['#fff1cf', '#9a723e'], lume: '#f6e7bf', accent: '#e2ad45', sub: ['#4b3822', '#1f150a'], moon: ['#231a2e', '#0b0710'], numerals: 'baton', bg: '#0c0906' },
  palace: { name: 'Memory Palace', blurb: 'Hidden dial. Lapis lazuli flecked with pyrite, yellow-gold case, gilt Roman numerals.', metal: 'gold', dial: ['#2b50a8', '#081645'], pattern: 'lapis',
    print: '#f4d98f', printDim: 'rgba(244,217,143,.6)', idx: ['#fff3c4', '#b8892e'], hand: ['#fff0c0', '#a8801f'], lume: '#fbeec4', accent: '#f0c75e', sub: ['#1e3a85', '#081338'], moon: ['#0a1440', '#020616'], numerals: 'roman', bg: '#04060e', secret: true }
};
const THEME_BASE = ['florence', 'crimson', 'ivory', 'nv', 'moth'];
const THEME_ORDER = THEME_BASE.slice();
function themeOrder() { return THEME_BASE.concat(Settings.unlockPalace ? ['palace'] : []); }
const LUME_GLOW = { florence: 'rgba(170,255,200,', crimson: 'rgba(255,214,150,', nv: 'rgba(170,255,150,', moth: 'rgba(255,220,150,', palace: 'rgba(255,230,160,' };

function metalConic(ctx, cx, cy, stops, rot = 0) {
  if (!ctx.createConicGradient) { const g = ctx.createLinearGradient(cx - 200, cy - 200, cx + 200, cy + 200); stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c)); return g; }
  const g = ctx.createConicGradient(rot, cx, cy); const n = stops.length;
  for (let k = 0; k <= n * 2; k++) g.addColorStop(k / (n * 2), stops[k % n]);
  return g;
}
function hexToRgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function mix(a, b, t) { const A = hexToRgb(a), B = hexToRgb(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], t))).join(',')})`; }
function spacedText(ctx, text, x, y, sp) {
  const chars = [...text]; const w = chars.reduce((s, c) => s + ctx.measureText(c).width, 0) + sp * (chars.length - 1);
  let cx = x - w / 2; const al = ctx.textAlign; ctx.textAlign = 'left';
  chars.forEach(c => { ctx.fillText(c, cx, y); cx += ctx.measureText(c).width + sp; }); ctx.textAlign = al; return w;
}
function arcText(ctx, text, cx, cy, rad, center, sp = 0, bottom = false) {
  const chars = [...text]; const ws = chars.map(c => ctx.measureText(c).width + sp);
  const total = ws.reduce((a, b) => a + b, 0) - sp; let a = center + (bottom ? total / 2 : -total / 2) / rad;
  ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  chars.forEach((c, i) => {
    const w = ws[i] - (i === chars.length - 1 ? sp : 0), mid = a + (bottom ? -1 : 1) * (w / 2) / rad;
    ctx.save(); ctx.translate(cx + Math.sin(mid) * rad, cy - Math.cos(mid) * rad); ctx.rotate(mid + (bottom ? Math.PI : 0));
    ctx.fillText(c, 0, 0); ctx.restore(); a += (bottom ? -1 : 1) * ws[i] / rad;
  });
  ctx.restore();
}
const ROMAN = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];

const Watch = {
  cv: null, ctx: null, W: 0, dpr: 1, R: 0, r: 0, theme: THEMES.florence, layers: {}, light: -Math.PI * 0.72, lightTarget: -Math.PI * 0.72,
  lightElev: 0.6, crownRot: 0, push: { top: 0, bot: 0 },
  state: { chrono: { elapsed: 0, running: false }, timer: null, alarm: null, session: null }, tourbTemp: false, repSlide: 0, glow: 1, secDisp: null, secTween: null, hi: false,
  metal() { const m = Settings.caseMetal; return METALS[m] ? m : this.theme.metal; },
  M() { return METALS[this.metal()]; },
  variant() { return !!(Settings.tourbillonDial || this.tourbTemp); },
  init(canvas) { this.cv = canvas; this.ctx = canvas.getContext('2d'); this.setTheme(Settings.theme, true); this.resize(); },
  setTheme(id, silent) { this.theme = THEMES[id] || THEMES.florence; this.layers = {}; if (!silent) this.build(); },
  resize() {
    const css = this.cv.clientWidth || 600; this.dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    this.W = css; this.cv.width = Math.round(css * this.dpr); this.cv.height = Math.round(css * this.dpr);
    this.R = css * 0.375; this.r = this.R * 0.80; this.build();
  },
  geom() { return { cx: this.W / 2, cy: this.W / 2, R: this.R, r: this.r, W: this.W }; },
  mk() { const c = document.createElement('canvas'); c.width = this.cv.width; c.height = this.cv.height; const x = c.getContext('2d'); x.scale(this.dpr, this.dpr); x.translate(this.W / 2, this.W / 2); return [c, x]; },
  build() { if (!this.W) return; this.layers = { inset: {} }; this.layers.metal = this.metal(); this.layers.variant = this.variant(); this.layers.case = this.buildCase(); this.layers.dial = this.buildDial(); },

  /* ——— static case ——— */
  buildCase() {
    const [c, x] = this.mk(), R = this.R, T = this.theme, M = this.M();
    // lugs (parallel, strap width ≈ R)
    const lug = (sx, sy) => {
      x.save(); x.scale(sx, sy);
      const lx = R * 0.5, w = R * 0.15, y0 = -R * 0.7, y1 = -R * 1.22;
      x.beginPath(); x.moveTo(lx, y0); x.lineTo(lx, y1 + w * 0.3); x.quadraticCurveTo(lx, y1, lx + w * 0.4, y1); x.lineTo(lx + w * 0.75, y1 + R * 0.02);
      x.quadraticCurveTo(lx + w, y1 + R * 0.06, lx + w * 1.05, y1 + R * 0.2); x.lineTo(lx + w * 1.45, y0); x.closePath();
      const g = x.createLinearGradient(lx, 0, lx + w * 1.4, 0);
      g.addColorStop(0, M[4]); g.addColorStop(0.18, M[0]); g.addColorStop(0.45, M[1]); g.addColorStop(0.7, M[3]); g.addColorStop(1, M[2]);
      x.fillStyle = g; x.fill();
      const g2 = x.createLinearGradient(0, y1, 0, y0); g2.addColorStop(0, 'rgba(255,255,255,.35)'); g2.addColorStop(0.3, 'rgba(255,255,255,0)'); g2.addColorStop(1, 'rgba(0,0,0,.35)');
      x.fillStyle = g2; x.fill(); x.strokeStyle = 'rgba(0,0,0,.35)'; x.lineWidth = 0.8; x.stroke();
      // spring-bar hole
      x.beginPath(); x.arc(lx + w * 0.62, y1 + R * 0.1, R * 0.018, 0, TAU); x.fillStyle = 'rgba(0,0,0,.55)'; x.fill();
      x.restore();
    };
    // shadow
    x.save(); x.shadowColor = 'rgba(0,0,0,.75)'; x.shadowBlur = R * 0.3; x.shadowOffsetY = R * 0.1;
    x.beginPath(); x.arc(0, 0, R * 0.99, 0, TAU); x.fillStyle = '#000'; x.fill(); x.restore();
    [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(([a, b]) => lug(a, b));
    // case band
    x.beginPath(); x.arc(0, 0, R, 0, TAU); x.fillStyle = metalConic(x, 0, 0, M, 0.3); x.fill();
    x.lineWidth = 1; x.strokeStyle = 'rgba(0,0,0,.5)'; x.stroke();
    { const rr = mulberry32(11); x.save(); x.beginPath(); x.arc(0, 0, R, 0, TAU); x.arc(0, 0, R * 0.975, 0, TAU, true); x.clip('evenodd'); x.lineWidth = 0.5;
      for (let k = 0; k < 520; k++) { const a = rr() * TAU, l = 0.03 + rr() * 0.12; x.strokeStyle = `rgba(${rr() < 0.5 ? '255,255,255' : '0,0,0'},${0.05 + rr() * 0.08})`; x.beginPath(); x.arc(0, 0, R * (0.976 + rr() * 0.024), a, a + l); x.stroke(); }
      x.restore(); }
    // bezel (polished) with engraved tachymeter
    const bo = R * 0.975, bi = R * 0.845;
    x.beginPath(); x.arc(0, 0, bo, 0, TAU); x.arc(0, 0, bi, 0, TAU, true); x.fillStyle = metalConic(x, 0, 0, [M[3], M[1], M[0], M[5], M[2], M[1]], -0.6); x.fill('evenodd');
    const bev = x.createRadialGradient(0, 0, bi, 0, 0, bo);
    bev.addColorStop(0, 'rgba(0,0,0,.35)'); bev.addColorStop(0.12, 'rgba(255,255,255,.18)'); bev.addColorStop(0.5, 'rgba(255,255,255,0)'); bev.addColorStop(0.9, 'rgba(0,0,0,.08)'); bev.addColorStop(1, 'rgba(0,0,0,.4)');
    x.fillStyle = bev; x.beginPath(); x.arc(0, 0, bo, 0, TAU); x.arc(0, 0, bi, 0, TAU, true); x.fill('evenodd');
    const engrave = (fn) => { x.save(); x.translate(0.6, 0.8); x.fillStyle = x.strokeStyle = 'rgba(255,255,255,.35)'; fn(); x.restore(); x.save(); x.fillStyle = x.strokeStyle = 'rgba(20,16,12,.72)'; fn(); x.restore(); };
    const tach = [500, 400, 300, 250, 200, 180, 160, 150, 140, 130, 120, 110, 100, 90, 80, 75, 70, 65, 60];
    engrave(() => {
      x.font = `600 ${R * 0.045}px Cinzel, serif`; x.textAlign = 'center'; x.textBaseline = 'middle';
      tach.forEach(v => {
        const a = (3600 / v) / 60 * TAU; const big = [500, 400, 300, 250, 200, 150, 120, 100, 90, 80, 70, 60].includes(v);
        x.save(); x.rotate(a); x.lineWidth = big ? 1.4 : 0.9; x.beginPath(); x.moveTo(0, -bi - R * 0.004); x.lineTo(0, -bi - R * (big ? 0.03 : 0.018)); x.stroke();
        if (big && v !== 60) x.fillText(String(v), 0, -(bi + bo) / 2 - R * 0.006); x.restore();
      });
      x.font = `600 ${R * 0.03}px Cinzel, serif`; arcText(x, 'TACHYMÈTRE', 0, 0, (bi + bo) / 2 - R * 0.004, 0.36, R * 0.01);
    });
    // rehaut (flange) with engraved maker's name
    const fo = bi, fi = this.r;
    const fg = x.createRadialGradient(0, 0, fi, 0, 0, fo); fg.addColorStop(0, mix(T.dial[1], '#000000', 0.35)); fg.addColorStop(1, mix(T.dial[0], '#000000', 0.1));
    x.beginPath(); x.arc(0, 0, fo, 0, TAU); x.arc(0, 0, fi, 0, TAU, true); x.fillStyle = fg; x.fill('evenodd');
    x.fillStyle = T.printDim; x.font = `600 ${R * 0.026}px Cinzel, serif`;
    for (let k = 0; k < 4; k++) arcText(x, 'CINCO CORPORATION', 0, 0, (fo + fi) / 2, k * Math.PI / 2 + Math.PI / 4, R * 0.012);
    for (let k = 0; k < 60; k++) { if (k % 15 === 7 || k % 15 === 8) continue; x.save(); x.rotate(k / 60 * TAU); x.fillRect(-0.4, -fo + R * 0.006, 0.8, R * (k % 5 ? 0.008 : 0.014)); x.restore(); }
    x.beginPath(); x.arc(0, 0, fi, 0, TAU); x.strokeStyle = 'rgba(0,0,0,.6)'; x.lineWidth = 1.2; x.stroke();
    return c;
  },

  /* ——— static dial (holes left for moon & date) ——— */
  buildDial() {
    const [c, x] = this.mk(), R = this.R, r = this.r, T = this.theme;
    x.save(); x.beginPath(); x.arc(0, 0, r, 0, TAU); x.clip();
    const bg = x.createRadialGradient(-r * 0.25, -r * 0.3, r * 0.05, 0, 0, r * 1.05); bg.addColorStop(0, T.dial[0]); bg.addColorStop(1, T.dial[1]);
    x.fillStyle = bg; x.fillRect(-r, -r, 2 * r, 2 * r);
    const rng = mulberry32(42);
    if (T.pattern === 'sunburst') {
      for (let k = 0; k < 900; k++) { const a = k / 900 * TAU; x.strokeStyle = k % 2 ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.07)'; x.lineWidth = 0.7; x.beginPath(); x.moveTo(Math.sin(a) * r * 0.03, -Math.cos(a) * r * 0.03); x.lineTo(Math.sin(a) * r, -Math.cos(a) * r); x.stroke(); }
    } else if (T.pattern === 'clous') {
      const p = r * 0.052; x.save(); x.rotate(Math.PI / 4);
      for (let gx = -r * 1.5; gx < r * 1.5; gx += p) for (let gy = -r * 1.5; gy < r * 1.5; gy += p) {
        if (gx * gx + gy * gy > r * r * 1.1) continue; const cx = gx + p / 2, cy = gy + p / 2, s = p * 0.47;
        const tri = (ax, ay, bx, by, col) => { x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + ax, cy + ay); x.lineTo(cx + bx, cy + by); x.closePath(); x.fillStyle = col; x.fill(); };
        tri(-s, -s, s, -s, 'rgba(255,220,200,.10)'); tri(s, -s, s, s, 'rgba(0,0,0,.12)'); tri(s, s, -s, s, 'rgba(0,0,0,.26)'); tri(-s, s, -s, -s, 'rgba(255,220,200,.04)');
      }
      x.restore();
    } else if (T.pattern === 'enamel') {
      for (let k = 0; k < 9000; k++) { const a = rng() * TAU, d = Math.sqrt(rng()) * r; x.fillStyle = `rgba(${rng() < 0.5 ? '255,255,255' : '120,100,70'},${rng() * 0.06})`; x.fillRect(Math.sin(a) * d, Math.cos(a) * d, 1.2, 1.2); }
      const gl = x.createRadialGradient(-r * 0.3, -r * 0.4, 0, -r * 0.3, -r * 0.4, r * 1.2); gl.addColorStop(0, 'rgba(255,255,255,.35)'); gl.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gl; x.fillRect(-r, -r, 2 * r, 2 * r);
    } else if (T.pattern === 'grid') {
      x.strokeStyle = 'rgba(160,255,150,.07)'; x.lineWidth = 0.7;
      for (let k = r * 0.04; k < r; k += r * 0.04) { x.beginPath(); x.arc(0, 0, k, 0, TAU); x.stroke(); }
      for (let k = 0; k < 24; k++) { const a = k / 24 * TAU; x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.sin(a) * r, -Math.cos(a) * r); x.stroke(); }
    } else if (T.pattern === 'lapis') {
      for (let k = 0; k < 700; k++) { const a = rng() * TAU, d = Math.sqrt(rng()) * r, s = r * (0.02 + rng() * 0.11); const g = x.createRadialGradient(Math.sin(a) * d, Math.cos(a) * d, 0, Math.sin(a) * d, Math.cos(a) * d, s);
        const c0 = rng() < 0.55 ? `rgba(90,130,230,${0.05 + rng() * 0.08})` : `rgba(3,8,40,${0.08 + rng() * 0.1})`; g.addColorStop(0, c0); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(Math.sin(a) * d - s, Math.cos(a) * d - s, s * 2, s * 2); }
      x.lineCap = 'round';
      for (let k = 0; k < 7; k++) { let px = (rng() - 0.5) * 2 * r, py = (rng() - 0.5) * 2 * r; x.beginPath(); x.moveTo(px, py); for (let j = 0; j < 8; j++) { px += (rng() - 0.5) * r * 0.25; py += (rng() - 0.3) * r * 0.2; x.lineTo(px, py); } x.strokeStyle = `rgba(215,225,250,${0.05 + rng() * 0.07})`; x.lineWidth = 0.6 + rng() * 2.2; x.stroke(); }
      for (let k = 0; k < 1300; k++) { const a = rng() * TAU, d = Math.sqrt(rng()) * r, s = 0.3 + rng() * rng() * 1.8; x.fillStyle = `rgba(${230 + rng() * 25 | 0},${185 + rng() * 40 | 0},${90 + rng() * 40 | 0},${0.25 + rng() * 0.7})`; x.beginPath(); x.arc(Math.sin(a) * d, Math.cos(a) * d, s, 0, TAU); x.fill(); }
    } else if (T.pattern === 'wing') {
      // scale rows + ochre band + veins
      const s = r * 0.028;
      for (let yy = -r; yy < r; yy += s * 0.62) for (let xx = -r + ((yy / s) % 2) * s * 0.5; xx < r; xx += s) {
        const band = Math.abs(Math.hypot(xx, yy + r * 0.4) - r * 0.95) < r * 0.13;
        const t = rng(); x.fillStyle = band ? `rgba(226,173,69,${0.10 + t * 0.12})` : (t < 0.5 ? `rgba(255,235,200,${t * 0.07})` : `rgba(0,0,0,${t * 0.12})`);
        x.beginPath(); x.ellipse(xx, yy, s * 0.5, s * 0.42, 0, 0, Math.PI); x.fill();
      }
      x.strokeStyle = 'rgba(20,12,5,.35)'; x.lineWidth = 1;
      for (let k = 0; k < 9; k++) { const a = -Math.PI * 0.85 + k * 0.21; x.beginPath(); x.moveTo(0, r * 1.05); x.quadraticCurveTo(Math.sin(a) * r * 0.5, r * 0.4 - Math.cos(a) * r * 0.1, Math.sin(a) * r * 1.1, -Math.cos(a) * r * 1.1 + r * 0.3); x.stroke(); }
    }
    x.restore();
    const S9 = { x: -r * 0.45, y: 0, s: r * 0.19 }, S3 = { x: r * 0.45, y: 0, s: r * 0.19 }, S6 = { x: 0, y: r * 0.43, s: r * 0.235 };
    this.sub = { S9, S3, S6 };
    // subdial recesses with azurage
    const recess = (S) => {
      x.save(); x.beginPath(); x.arc(S.x, S.y, S.s, 0, TAU); x.clip();
      const g = x.createRadialGradient(S.x, S.y, 0, S.x, S.y, S.s); g.addColorStop(0, T.sub[0]); g.addColorStop(1, T.sub[1]); x.fillStyle = g; x.fill();
      for (let k = 2; k < S.s; k += 1.6) { x.beginPath(); x.arc(S.x, S.y, k, 0, TAU); x.strokeStyle = (k | 0) % 2 ? 'rgba(255,255,255,.045)' : 'rgba(0,0,0,.06)'; x.lineWidth = 0.8; x.stroke(); }
      const sh = x.createRadialGradient(S.x + S.s * 0.08, S.y + S.s * 0.1, S.s * 0.8, S.x, S.y, S.s * 1.02); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,.45)'); x.fillStyle = sh; x.fillRect(S.x - S.s, S.y - S.s, S.s * 2, S.s * 2);
      x.restore();
      x.beginPath(); x.arc(S.x, S.y, S.s, 0, TAU); x.strokeStyle = 'rgba(255,255,255,.14)'; x.lineWidth = 1; x.stroke();
    };
    const VAR = this.variant(); this.tourbAp = VAR ? { x: S6.x, y: S6.y, s: S6.s * 1.04 } : null;
    (VAR ? [S9, S3] : [S9, S3, S6]).forEach(recess);
    x.fillStyle = x.strokeStyle = T.print;
    const subTrack = (S, n, bigEvery, labels, labelFn) => {
      for (let k = 0; k < n; k++) { const big = k % bigEvery === 0; x.save(); x.translate(S.x, S.y); x.rotate(k / n * TAU); x.lineWidth = big ? 1.3 : 0.7; x.beginPath(); x.moveTo(0, -S.s * 0.93); x.lineTo(0, -S.s * (big ? 0.76 : 0.84)); x.stroke(); x.restore(); }
      x.font = `600 ${S.s * 0.2}px Cinzel, serif`; x.textAlign = 'center'; x.textBaseline = 'middle';
      labels.forEach(k => { const a = k / n * TAU; x.fillText(labelFn(k), S.x + Math.sin(a) * S.s * 0.58, S.y - Math.cos(a) * S.s * 0.58); });
    };
    subTrack(S9, 60, 5, [0, 20, 40], k => k === 0 ? '60' : String(k));
    subTrack(S3, 30, 5, [0, 10, 20], k => k === 0 ? '30' : String(k));
    x.font = `600 ${S3.s * 0.12}px Cinzel, serif`; x.fillStyle = T.printDim; x.fillText('CHRONO', S3.x, S3.y + S3.s * 0.36); x.fillText('SECONDI', S9.x, S9.y + S9.s * 0.36);
    // moon subdial: date ring 1..31 and aperture hole (or the tourbillon aperture)
    x.fillStyle = x.strokeStyle = T.print;
    if (VAR) {
      const A = this.tourbAp; x.save(); x.globalCompositeOperation = 'destination-out'; x.beginPath(); x.arc(A.x, A.y, A.s, 0, TAU); x.fill(); x.restore();
      const M = this.M(); x.beginPath(); x.arc(A.x, A.y, A.s + S6.s * 0.035, 0, TAU); x.lineWidth = S6.s * 0.07; x.strokeStyle = metalConic(x, A.x, A.y, [M[0], M[2], M[3], M[4], M[1]], 0.5); x.stroke();
      x.beginPath(); x.arc(A.x, A.y, A.s, 0, TAU); x.lineWidth = 1; x.strokeStyle = 'rgba(0,0,0,.6)'; x.stroke();
      this.moonAp = null;
    }
    for (let d = 1; d <= 31 && !VAR; d++) {
      const a = (d - 1) / 31 * TAU; x.save(); x.translate(S6.x, S6.y); x.rotate(a); x.lineWidth = 0.7; x.beginPath(); x.moveTo(0, -S6.s * 0.95); x.lineTo(0, -S6.s * (d % 5 === 0 || d === 1 ? 0.86 : 0.9)); x.stroke(); x.restore();
      if (d % 2 === 1) { x.font = `600 ${S6.s * 0.105}px Cinzel, serif`; x.fillText(String(d), S6.x + Math.sin(a) * S6.s * 0.77, S6.y - Math.cos(a) * S6.s * 0.77); }
    }
    if (!VAR) {
    const A = this.moonAp = { x: S6.x, y: S6.y + S6.s * 0.14, a: S6.s * 0.56 };
    x.save(); x.globalCompositeOperation = 'destination-out';
    x.beginPath(); x.arc(A.x, A.y, A.a, Math.PI, 0); x.closePath(); x.fill(); x.restore();
    // humps restore (dial-coloured) — draw them back over the hole
    x.save(); x.beginPath(); x.arc(A.x, A.y, A.a + 1, Math.PI, 0); x.closePath(); x.clip();
    [-1, 1].forEach(sgn => { x.beginPath(); x.arc(A.x + sgn * A.a / 2, A.y, A.a / 2, Math.PI, 0); x.closePath(); const hg = x.createRadialGradient(A.x + sgn * A.a / 2, A.y - A.a * 0.1, 0, A.x + sgn * A.a / 2, A.y, A.a / 2); hg.addColorStop(0, T.sub[0]); hg.addColorStop(1, T.sub[1]); x.fillStyle = hg; x.fill(); x.strokeStyle = 'rgba(0,0,0,.35)'; x.lineWidth = 1; x.stroke(); });
    x.restore();
    x.beginPath(); x.arc(A.x, A.y, A.a, Math.PI, 0); x.closePath(); x.strokeStyle = 'rgba(255,255,255,.25)'; x.lineWidth = 1; x.stroke();
    }
    // minute / fifth-second railroad track
    x.strokeStyle = T.print; x.fillStyle = T.print;
    x.lineWidth = 0.8; [0.925, 0.978].forEach(k => { x.beginPath(); x.arc(0, 0, r * k, 0, TAU); x.stroke(); });
    for (let k = 0; k < 300; k++) { if (k % 5 === 0) continue; x.save(); x.rotate(k / 300 * TAU); x.lineWidth = 0.45; x.beginPath(); x.moveTo(0, -r * 0.978); x.lineTo(0, -r * 0.955); x.stroke(); x.restore(); }
    for (let k = 0; k < 60; k++) { x.save(); x.rotate(k / 60 * TAU); x.lineWidth = k % 5 ? 0.9 : 1.8; x.beginPath(); x.moveTo(0, -r * 0.978); x.lineTo(0, -r * (k % 5 ? 0.925 : 0.915)); x.stroke(); x.restore(); }
    // hour markers
    const idxShadow = () => { x.shadowColor = 'rgba(0,0,0,.55)'; x.shadowBlur = r * 0.012; x.shadowOffsetX = r * 0.006; x.shadowOffsetY = r * 0.009; };
    for (let h = 0; h < 12; h++) {
      const a = h / 12 * TAU; if (h === 6) continue;
      if (T.numerals === 'roman' || T.numerals === 'painted') {
        if (h === 3 || h === 9) continue;
        x.save(); x.rotate(a); x.translate(0, -r * 0.775);
        x.font = `${T.numerals === 'roman' ? 700 : 500} ${r * (h === 0 ? 0.15 : 0.12)}px Cinzel, serif`; x.textAlign = 'center'; x.textBaseline = 'middle';
        if (T.numerals === 'roman') {
          idxShadow(); const g = x.createLinearGradient(0, -r * 0.07, 0, r * 0.07); g.addColorStop(0, T.idx[0]); g.addColorStop(0.5, T.idx[1]); g.addColorStop(1, T.idx[0]); x.fillStyle = g;
        } else x.fillStyle = T.print;
        x.fillText(ROMAN[h], 0, 0); x.restore(); continue;
      }
      const short = h === 3 || h === 9, len = short ? r * 0.1 : r * 0.155, w = r * 0.036, outer = r * 0.885;
      const one = (ox) => {
        x.save(); x.rotate(a); x.translate(ox, 0); idxShadow();
        const g = x.createLinearGradient(-w / 2, 0, w / 2, 0); g.addColorStop(0, T.idx[0]); g.addColorStop(0.48, T.idx[1]); g.addColorStop(0.52, T.idx[0]); g.addColorStop(1, T.idx[1]);
        x.fillStyle = g; roundRect(x, -w / 2, -outer, w, len, w * 0.2); x.fill(); x.shadowColor = 'transparent';
        x.fillStyle = T.lume; roundRect(x, -w * 0.22, -outer + w * 0.35, w * 0.44, len - w * 0.7, w * 0.15); x.fill();
        x.restore();
      };
      if (h === 0) { one(-w * 0.8); one(w * 0.8); } else one(0);
    }
    // printing — the maker's mark under 12
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = T.print;
    const crestY = -r * 0.575; // Cinco crest: five stars in an arc
    for (let k = 0; k < 5; k++) { const a = (k - 2) * 0.22; star(x, Math.sin(a) * r * 0.16, crestY + r * 0.16 - Math.cos(a) * r * 0.16, r * 0.017, T.print); }
    x.font = `700 ${r * 0.066}px Cinzel, serif`; spacedText(x, 'CINCO', 0, -r * 0.47, r * 0.028);
    x.font = `600 ${r * 0.034}px Cinzel, serif`; spacedText(x, 'CORPORATION', 0, -r * 0.405, r * 0.018);
    x.font = `${r * 0.1}px "Pinyon Script", cursive`; x.fillStyle = T.numerals === 'painted' ? '#7b1d1d' : T.accent; x.fillText('Il Dottore', 0, -r * 0.29);
    x.fillStyle = T.printDim; x.font = `600 ${r * 0.03}px Cinzel, serif`; spacedText(x, VAR ? 'TOURBILLON · AUTOMATIQUE' : 'CHRONOGRAPHE · AUTOMATIQUE', 0, r * 0.155, r * 0.008);
    x.font = `600 ${r * 0.026}px Cinzel, serif`; spacedText(x, 'FIRENZE', 0, r * 0.905 - r * 0.03, r * 0.02);
    return c;
  },

  /* ——— per-frame ——— */
  render(now = new Date()) {
    const ctx = this.ctx, R = this.R, r = this.r, T = this.theme;
    if (!this.layers.case || this.layers.metal !== this.metal() || this.layers.variant !== this.variant()) this.build();
    let dl = ((this.lightTarget - this.light) % TAU + TAU * 1.5) % TAU - Math.PI; if (!this.hi) this.light += dl * 0.08;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, this.cv.width, this.cv.height);
    ctx.drawImage(this.layers.case, 0, 0);
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); ctx.translate(this.W / 2, this.W / 2);
    const L = this.light, lx = Math.sin(L), ly = -Math.cos(L);
    this.drawCrownPushers(ctx);
    // dynamic case sheen
    if (ctx.createConicGradient) {
      ctx.save(); ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.arc(0, 0, R * 0.845, 0, TAU, true); ctx.clip('evenodd');
      const g = ctx.createConicGradient(L - Math.PI / 2, 0, 0);
      [[0, .5], [.08, 0], [.42, 0], [.5, .28], [.58, 0], [.92, 0], [1, .5]].forEach(([p, a]) => g.addColorStop(p, `rgba(255,255,255,${a})`));
      ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = g; ctx.fillRect(-R, -R, 2 * R, 2 * R); ctx.globalCompositeOperation = 'source-over'; ctx.restore();
      this.drawSpecular(ctx, L);
    }
    this.drawRepeaterSlide(ctx);
    // under-dial: moon disc & aperture sky, or the tourbillon
    if (this.tourbAp && typeof Tourbillon !== 'undefined') Tourbillon.draw(ctx, this.tourbAp.x, this.tourbAp.y, this.tourbAp.s, performance.now() / 1000, { mini: true, metal: this.M() });
    else { const mp = moonPhase(now); this.drawMoon(ctx, mp); }
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(this.layers.dial, 0, 0); ctx.restore();
    this.drawInset(ctx, L);
    // anisotropic dial sheen
    if (ctx.createConicGradient && (T.pattern === 'sunburst' || T.pattern === 'grid' || T.pattern === 'wing' || T.pattern === 'clous')) {
      ctx.save(); ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.clip();
      const g = ctx.createConicGradient(L - Math.PI / 2, 0, 0), s = T.pattern === 'sunburst' ? 0.22 : 0.1;
      [[0, s], [.1, 0], [.4, 0], [.5, s * 0.8], [.6, 0], [.9, 0], [1, s]].forEach(([p, a]) => g.addColorStop(p, `rgba(255,255,255,${a})`));
      ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = g; ctx.fillRect(-r, -r, 2 * r, 2 * r); ctx.restore();
    }
    // complications
    const st = this.state, ms = now.getMilliseconds(), sec = now.getSeconds() + ms / 1000;
    const bps = Settings.seconds === 'tick' ? 1 : 8, bf = sec * bps, bi = Math.floor(bf), fr = bf - bi, win = bps === 1 ? 0.09 : 0.3;
    const eb = (u) => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2); }; // ease-out-back: a tiny overshoot on every beat
    const beat = (bi - 1 + (fr < win ? eb(fr / win) : 1)) / bps; // 28,800 vph, each beat eased
    this.drawTimerArc(ctx, st.timer); this.drawTimerArc(ctx, st.session, true); this.drawAlarmMarker(ctx, st.alarm);
    const { S9, S3, S6 } = this.sub;
    this.subHand(ctx, S9, beat / 60, T.print);
    const ce = st.chrono.elapsed, cmin = Math.floor(ce / 60000) % 30;
    this.subHand(ctx, S3, (cmin + (ce % 60000 > 59900 ? 1 : 0)) / 30, T.accent);
    if (!this.tourbAp) this.subHand(ctx, S6, (now.getDate() - 1) / 31, T.numerals === 'painted' ? '#8a1e1e' : T.accent, 0.84, true);
    this.drawLumeGlow(ctx);
    // main hands
    const mins = now.getMinutes() + sec / 60, hrs = (now.getHours() % 12) + mins / 60;
    this.dauphine(ctx, hrs / 12 * TAU, r * 0.56, r * 0.052, 3);
    this.dauphine(ctx, mins / 60 * TAU, r * 0.86, r * 0.042, 4);
    const chronoShown = st.chrono.running || ce > 0 || Settings.seconds === 'chrono';
    let secAng = chronoShown ? (Math.floor((ce % 60000) / 125) * 125 / 60000) * TAU : (((beat % 60) + 60) % 60 / 60) * TAU;
    // flyback: when the chronograph resets, the hand sweeps back instead of teleporting
    const src = chronoShown ? 'c' : 's', pn = performance.now();
    if (this.secSrc && this.secSrc !== src && this.secDisp != null && !this.hi) this.secTween = { from: this.secDisp, t0: pn };
    if (this.secSrc === 'c' && src === 'c' && this.secDisp != null && secAng < this.secDisp - 0.3 && ce < 400 && !this.hi) this.secTween = { from: this.secDisp, t0: pn };
    this.secSrc = src;
    if (this.secTween) { const u = clamp((pn - this.secTween.t0) / 420, 0, 1), e = 1 - Math.pow(1 - u, 3); secAng = lerp(this.secTween.from, secAng, e); if (u >= 1) this.secTween = null; }
    this.secDisp = secAng;
    this.secondsHand(ctx, secAng);
    this.drawCrystal(ctx, lx, ly);
  },
  drawCrownPushers(ctx) {
    const R = this.R, M = this.M();
    const cyl = (len, w, pressed, knurl) => {
      const x0 = R * 0.96 - pressed, g = ctx.createLinearGradient(0, -w / 2, 0, w / 2);
      g.addColorStop(0, M[4]); g.addColorStop(0.25, M[0]); g.addColorStop(0.5, M[1]); g.addColorStop(0.8, M[2]); g.addColorStop(1, M[4]);
      ctx.fillStyle = g; roundRect(ctx, x0, -w / 2, len, w, w * 0.18); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = 0.8; ctx.stroke();
      if (knurl) { ctx.save(); roundRect(ctx, x0 + len * 0.35, -w / 2, len * 0.62, w, w * 0.15); ctx.clip(); ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1;
        const step = w / 11, off = (this.crownRot % step + step) % step;
        for (let y = -w / 2 - step + off; y < w / 2 + step; y += step) { ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + len * 1.1, y); ctx.stroke(); }
        ctx.restore(); }
    };
    ctx.save(); cyl(R * 0.07, R * 0.1, 0); ctx.restore(); // crown tube
    ctx.save(); ctx.translate(R * 0.05, 0); cyl(R * 0.1, R * 0.2, 0, true); ctx.restore();
    ctx.save(); ctx.rotate(-Math.PI / 6); cyl(R * 0.1, R * 0.085, this.push.top * R * 0.03); ctx.restore();
    ctx.save(); ctx.rotate(Math.PI / 6); cyl(R * 0.1, R * 0.085, this.push.bot * R * 0.03); ctx.restore();
    this.push.top *= 0.85; this.push.bot *= 0.85;
  },
  drawMoon(ctx, mp) {
    const A = this.moonAp, T = this.theme; if (!A) return;
    ctx.save(); ctx.beginPath(); ctx.arc(A.x, A.y, A.a + 1, Math.PI, 0); ctx.closePath(); ctx.clip();
    const sky = ctx.createRadialGradient(A.x, A.y - A.a * 0.3, 0, A.x, A.y, A.a * 1.1); sky.addColorStop(0, T.moon[0]); sky.addColorStop(1, T.moon[1]);
    ctx.fillStyle = sky; ctx.fillRect(A.x - A.a, A.y - A.a, A.a * 2, A.a);
    const rot = -Math.PI / 2 + mp.frac * Math.PI; // two-moon disc: half turn per lunation
    const rng = mulberry32(7); ctx.save(); ctx.translate(A.x, A.y); ctx.rotate(rot);
    for (let k = 0; k < 70; k++) { const a = rng() * TAU, d = rng() * A.a; ctx.globalAlpha = 0.3 + rng() * 0.7; star(ctx, Math.sin(a) * d, -Math.cos(a) * d, A.a * (0.02 + rng() * 0.035), T.nv ? '#c8ffc0' : '#f5e3b0'); }
    ctx.globalAlpha = 1;
    [0, Math.PI].forEach(o => { ctx.save(); ctx.rotate(o); const mx = 0, my = -A.a * 0.5, mr = A.a * 0.4;
      const mg = ctx.createRadialGradient(mx - mr * 0.35, my - mr * 0.35, mr * 0.1, mx, my, mr);
      if (T.nv) { mg.addColorStop(0, '#eaffe4'); mg.addColorStop(1, '#5a9a55'); } else { mg.addColorStop(0, '#fff6d8'); mg.addColorStop(0.6, '#e9c877'); mg.addColorStop(1, '#a37a2c'); }
      ctx.beginPath(); ctx.arc(mx, my, mr, 0, TAU); ctx.fillStyle = mg; ctx.fill();
      ctx.fillStyle = 'rgba(120,80,20,.28)'; [[-.3, -.2, .22], [.25, .1, .16], [-.05, .35, .12], [.3, -.35, .1], [-.4, .25, .08]].forEach(([a, b, s]) => { ctx.beginPath(); ctx.arc(mx + a * mr, my + b * mr, s * mr, 0, TAU); ctx.fill(); });
      ctx.restore(); });
    ctx.restore(); ctx.restore();
  },
  subHand(ctx, S, frac, col, len = 0.82, thin = false) {
    const a = frac * TAU; ctx.save(); ctx.translate(S.x, S.y); ctx.rotate(a);
    ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 2; ctx.shadowOffsetX = -Math.sin(this.light) * 1.5; ctx.shadowOffsetY = Math.cos(this.light) * 1.5;
    ctx.fillStyle = col; ctx.beginPath(); const w = S.s * (thin ? 0.025 : 0.04);
    ctx.moveTo(-w, S.s * 0.2); ctx.lineTo(-w * 0.4, -S.s * len); ctx.lineTo(w * 0.4, -S.s * len); ctx.lineTo(w, S.s * 0.2); ctx.closePath(); ctx.fill();
    if (thin) { ctx.beginPath(); ctx.moveTo(0, -S.s * len - S.s * 0.02); ctx.lineTo(-S.s * 0.05, -S.s * (len - 0.12)); ctx.lineTo(S.s * 0.05, -S.s * (len - 0.12)); ctx.closePath(); ctx.fill(); }
    ctx.shadowColor = 'transparent'; ctx.beginPath(); ctx.arc(0, 0, S.s * 0.07, 0, TAU); const M = this.M(); const g = ctx.createRadialGradient(-1, -1, 0, 0, 0, S.s * 0.07); g.addColorStop(0, M[0]); g.addColorStop(1, M[2]); ctx.fillStyle = g; ctx.fill();
    ctx.restore();
  },
  dauphine(ctx, a, len, w, elev) {
    const T = this.theme, L = this.light;
    ctx.save(); ctx.rotate(a);
    ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = elev * 2.2; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
    // shadow offset in rotated frame
    const sx = -Math.sin(L - a) * elev * 1.6, sy = Math.cos(L - a) * elev * 1.6; ctx.shadowOffsetX = sx * Math.cos(0); ctx.shadowOffsetY = sy;
    const tail = len * 0.14;
    const bL = 0.5 + 0.5 * Math.cos(a - Math.PI / 2 - L), bR = 0.5 + 0.5 * Math.cos(a + Math.PI / 2 - L);
    ctx.beginPath(); ctx.moveTo(0, -len); ctx.lineTo(-w, -len * 0.18); ctx.lineTo(-w * 0.45, tail); ctx.lineTo(w * 0.45, tail); ctx.lineTo(w, -len * 0.18); ctx.closePath();
    ctx.fillStyle = T.hand[1]; ctx.fill(); ctx.shadowColor = 'transparent';
    ctx.beginPath(); ctx.moveTo(0, -len); ctx.lineTo(-w, -len * 0.18); ctx.lineTo(-w * 0.45, tail); ctx.lineTo(0, tail); ctx.closePath(); ctx.fillStyle = mix(T.hand[1], T.hand[0], bL); ctx.fill();
    ctx.beginPath(); ctx.moveTo(0, -len); ctx.lineTo(w, -len * 0.18); ctx.lineTo(w * 0.45, tail); ctx.lineTo(0, tail); ctx.closePath(); ctx.fillStyle = mix(T.hand[1], T.hand[0], bR); ctx.fill();
    ctx.beginPath(); ctx.moveTo(0, -len); ctx.lineTo(0, tail); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 0.6; ctx.stroke();
    if (T.pattern !== 'enamel') { ctx.beginPath(); ctx.moveTo(0, -len * 0.9); ctx.lineTo(-w * 0.32, -len * 0.25); ctx.lineTo(0, -len * 0.2); ctx.lineTo(w * 0.32, -len * 0.25); ctx.closePath(); ctx.fillStyle = T.lume; ctx.globalAlpha = 0.85;
      const gc = this.glowAmt(); if (gc > 0) { ctx.shadowColor = LUME_GLOW[Settings.theme] + (0.55 * gc).toFixed(3) + ')'; ctx.shadowBlur = this.r * 0.05 * gc; ctx.shadowOffsetX = ctx.shadowOffsetY = 0; }
      ctx.fill(); ctx.shadowColor = 'transparent'; ctx.globalAlpha = 1; }
    ctx.restore();
  },
  secondsHand(ctx, a) {
    const r = this.r, T = this.theme, L = this.light, M = this.M();
    ctx.save(); ctx.rotate(a);
    ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 6; ctx.shadowOffsetX = -Math.sin(L - a) * 7; ctx.shadowOffsetY = Math.cos(L - a) * 7;
    ctx.fillStyle = T.accent; ctx.beginPath(); ctx.moveTo(-r * 0.006, r * 0.18); ctx.lineTo(-r * 0.0035, -r * 0.96); ctx.lineTo(r * 0.0035, -r * 0.96); ctx.lineTo(r * 0.006, r * 0.18); ctx.closePath(); ctx.fill();
    // moth-shaped counterweight
    ctx.save(); ctx.translate(0, r * 0.19); const s = r * 0.05;
    ctx.beginPath(); ctx.moveTo(0, -s * 0.9); ctx.bezierCurveTo(-s * 1.4, -s * 1.2, -s * 1.6, s * 0.1, -s * 0.2, s * 0.2); ctx.bezierCurveTo(-s * 0.9, s * 0.6, -s * 0.6, s * 1.1, 0, s * 0.5);
    ctx.bezierCurveTo(s * 0.6, s * 1.1, s * 0.9, s * 0.6, s * 0.2, s * 0.2); ctx.bezierCurveTo(s * 1.6, s * 0.1, s * 1.4, -s * 1.2, 0, -s * 0.9); ctx.fill();
    ctx.restore(); ctx.shadowColor = 'transparent';
    ctx.beginPath(); ctx.arc(0, -r * 0.8, r * 0.014, 0, TAU); ctx.fillStyle = T.lume; ctx.fill(); ctx.strokeStyle = T.accent; ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();
    // centre stack
    const cap = (rad, cols) => { const g = ctx.createRadialGradient(-rad * 0.4, -rad * 0.4, 0, 0, 0, rad); g.addColorStop(0, cols[0]); g.addColorStop(1, cols[1]); ctx.beginPath(); ctx.arc(0, 0, rad, 0, TAU); ctx.fillStyle = g; ctx.fill(); };
    cap(r * 0.035, [T.hand[0], T.hand[1]]); cap(r * 0.022, [mix(T.accent.length === 7 ? T.accent : '#c1272d', '#ffffff', 0.3), T.accent]); cap(r * 0.008, [M[0], M[2]]);
  },
  drawTimerArc(ctx, t, session) {
    if (!t || !t.active) return; const r = this.r, rad = r * (session ? (this.state.timer ? 0.875 : 0.9) : 0.9), col = session ? (t.rest ? '#7fb7a0' : '#d8b36a') : this.theme.accent;
    ctx.save(); ctx.rotate(-Math.PI / 2); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(0, 0, rad, 0, TAU); ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = r * 0.012; ctx.stroke();
    ctx.shadowColor = col; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(0, 0, rad, 0, Math.max(0.001, t.frac) * TAU); ctx.strokeStyle = col; ctx.lineWidth = r * 0.012; ctx.stroke();
    ctx.restore();
  },
  glowAmt() { if (this.theme.pattern === 'enamel' || Settings.lumeGlow === false) return 0; return this.glow * (Settings.theme === 'nv' ? 1.2 : 0.8); },
  drawLumeGlow(ctx) {
    const gc = this.glowAmt(), T = this.theme; if (gc <= 0 || T.numerals !== 'baton') return; const r = this.r;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = LUME_GLOW[Settings.theme] + (0.16 * gc).toFixed(3) + ')'; ctx.shadowColor = LUME_GLOW[Settings.theme] + (0.7 * gc).toFixed(3) + ')'; ctx.shadowBlur = r * 0.045 * gc;
    const w = r * 0.036, outer = r * 0.885;
    for (let h = 0; h < 12; h++) { if (h === 6) continue; const short = h === 3 || h === 9, len = short ? r * 0.1 : r * 0.155;
      const one = (ox) => { ctx.save(); ctx.rotate(h / 12 * TAU); ctx.translate(ox, 0); roundRect(ctx, -w * 0.22, -outer + w * 0.35, w * 0.44, len - w * 0.7, w * 0.15); ctx.fill(); ctx.restore(); };
      if (h === 0) { one(-w * 0.8); one(w * 0.8); } else one(0); }
    ctx.restore();
  },
  drawSpecular(ctx, L) {
    // hard-edged "softbox" reflections on the polished bezel, the way a studio light sits on real metal
    const R = this.R, bo = R * 0.975, bi = R * 0.845, a0 = L - Math.PI / 2;
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, bo, 0, TAU); ctx.arc(0, 0, bi, 0, TAU, true); ctx.clip('evenodd');
    const g = ctx.createConicGradient(a0 - 0.24, 0, 0);
    [[0, 0], [0.012, .42], [0.05, .5], [0.066, 0], [0.083, 0], [0.09, .22], [0.1, 0], [0.49, 0], [0.505, .16], [0.535, .16], [0.55, 0], [1, 0]].forEach(([p, a]) => g.addColorStop(p, `rgba(255,255,255,${a})`));
    ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = g; ctx.fillRect(-R, -R, 2 * R, 2 * R); ctx.restore();
    // bevel edges catch the light
    ctx.save(); ctx.lineWidth = 1.1;
    const e1 = ctx.createConicGradient(a0 - Math.PI, 0, 0); [[0, 'rgba(255,255,255,0)'], [0.5, 'rgba(255,255,255,.75)'], [1, 'rgba(255,255,255,0)']].forEach(([p, c]) => e1.addColorStop(p, c));
    ctx.strokeStyle = e1; ctx.beginPath(); ctx.arc(0, 0, bi + 0.8, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, R - 0.6, 0, TAU); ctx.globalAlpha = 0.6; ctx.stroke(); ctx.restore();
  },
  drawInset(ctx, L) {
    // the rehaut casts a soft shadow onto the sunken dial on the side facing the light
    const q = ((Math.round(L / TAU * 48) % 48) + 48) % 48, r = this.r;
    let c = this.layers.inset && this.layers.inset[q];
    if (!c) { const [cc, x] = this.mk(), a = q / 48 * TAU, lx = Math.sin(a), ly = -Math.cos(a);
      x.beginPath(); x.arc(0, 0, r, 0, TAU); x.clip(); x.shadowColor = 'rgba(0,0,0,.6)'; x.shadowBlur = r * 0.07 * this.dpr; x.shadowOffsetX = -lx * r * 0.035 * this.dpr; x.shadowOffsetY = -ly * r * 0.035 * this.dpr;
      x.beginPath(); x.rect(-r * 2, -r * 2, r * 4, r * 4); x.arc(0, 0, r * 1.002, 0, TAU, true); x.fillStyle = '#000'; x.fill('evenodd');
      c = cc; if (this.layers.inset) this.layers.inset[q] = c; }
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(c, 0, 0); ctx.restore();
  },
  drawRepeaterSlide(ctx) {
    const R = this.R, M = this.M(), off = this.repSlide * 0.2; this.repSlide *= 0.93;
    ctx.save(); ctx.rotate(Math.PI * 1.42 - off); // left flank, between eight and nine
    const g = ctx.createLinearGradient(0, -R * 1.04, 0, -R * 0.99); g.addColorStop(0, M[4]); g.addColorStop(0.35, M[0]); g.addColorStop(0.7, M[1]); g.addColorStop(1, M[2]);
    ctx.fillStyle = g; roundRect(ctx, -R * 0.075, -R * 1.035, R * 0.15, R * 0.05, R * 0.02); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.lineWidth = 0.8; ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,.3)'; for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(k * R * 0.016, -R * 1.03); ctx.lineTo(k * R * 0.016, -R * 1.0); ctx.stroke(); }
    ctx.restore();
  },
  drawAlarmMarker(ctx, al) {
    if (!al) return; const r = this.r, a = ((al.h % 12) + al.m / 60) / 12 * TAU;
    ctx.save(); ctx.rotate(a); ctx.fillStyle = this.theme.accent; ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 3;
    ctx.beginPath(); ctx.moveTo(0, -r * 0.985); ctx.lineTo(-r * 0.028, -r * 1.035); ctx.lineTo(r * 0.028, -r * 1.035); ctx.closePath(); ctx.fill(); ctx.restore();
  },
  drawCrystal(ctx, lx, ly) {
    const R = this.R, r = this.r, cr = R * 0.845;
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, cr, 0, TAU); ctx.clip();
    const edge = ctx.createRadialGradient(0, 0, r * 0.9, 0, 0, cr); edge.addColorStop(0, 'rgba(0,0,0,0)'); edge.addColorStop(0.55, 'rgba(0,0,0,.18)'); edge.addColorStop(1, 'rgba(0,0,0,.45)');
    ctx.fillStyle = edge; ctx.fillRect(-cr, -cr, cr * 2, cr * 2);
    const hx = lx * cr * 0.55, hy = ly * cr * 0.55, g = ctx.createRadialGradient(hx, hy, 0, hx, hy, cr * 0.95);
    g.addColorStop(0, 'rgba(255,255,255,.16)'); g.addColorStop(0.35, 'rgba(255,255,255,.05)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(-cr, -cr, cr * 2, cr * 2);
    // crescent highlight
    ctx.lineCap = 'round'; [[0.9, 0.012, .10], [0.55, 0.006, .28]].forEach(([sp, lw, al]) => { ctx.beginPath(); ctx.arc(0, 0, cr * 0.975, this.light - Math.PI / 2 - sp, this.light - Math.PI / 2 + sp); ctx.strokeStyle = `rgba(255,255,255,${al})`; ctx.lineWidth = cr * lw; ctx.stroke(); });
    ctx.beginPath(); ctx.arc(0, 0, cr * 0.94, this.light + Math.PI / 2 - 0.5, this.light + Math.PI / 2 + 0.5); ctx.strokeStyle = 'rgba(120,150,255,.07)'; ctx.lineWidth = cr * 0.03; ctx.stroke();
    // window-pane reflection band
    ctx.save(); ctx.rotate(this.light + 0.7); const band = ctx.createLinearGradient(-cr, 0, cr, 0);
    band.addColorStop(0.18, 'rgba(255,255,255,0)'); band.addColorStop(0.24, 'rgba(255,255,255,.045)'); band.addColorStop(0.33, 'rgba(255,255,255,.045)'); band.addColorStop(0.36, 'rgba(255,255,255,0)');
    ctx.fillStyle = band; ctx.fillRect(-cr, -cr, cr * 2, cr * 2); ctx.restore();
    // softbox reflected in the domed sapphire: two soft panes that drift with the light and tilt
    const tx = (typeof App !== 'undefined' ? App.tiltY : 0) * cr * 0.012, ty = (typeof App !== 'undefined' ? -App.tiltX : 0) * cr * 0.012;
    ctx.save(); ctx.translate(lx * cr * 0.42 + tx, ly * cr * 0.42 + ty); ctx.rotate(this.light); ctx.fillStyle = 'rgba(255,255,255,.035)';
    roundRect(ctx, -cr * 0.2, -cr * 0.12, cr * 0.17, cr * 0.26, cr * 0.03); ctx.fill(); roundRect(ctx, cr * 0.02, -cr * 0.12, cr * 0.17, cr * 0.26, cr * 0.03); ctx.fill(); ctx.restore();
    // anti-reflective coating: a faint violet-blue bloom opposite the light
    const ar = ctx.createRadialGradient(-lx * cr * 0.5, -ly * cr * 0.5, 0, -lx * cr * 0.5, -ly * cr * 0.5, cr * 0.9);
    ar.addColorStop(0, 'rgba(110,120,255,.06)'); ar.addColorStop(0.5, 'rgba(160,90,220,.025)'); ar.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = ar; ctx.fillRect(-cr, -cr, cr * 2, cr * 2);
    // refraction at the edge of the crystal: a dark thin ring and a bright caustic rim
    ctx.beginPath(); ctx.arc(0, 0, cr * 0.992, 0, TAU); ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.lineWidth = cr * 0.012; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, cr * 0.982, this.light + Math.PI / 2 - 0.7, this.light + Math.PI / 2 + 0.7); ctx.strokeStyle = 'rgba(255,255,255,.16)'; ctx.lineWidth = cr * 0.004; ctx.stroke();
    ctx.restore();
  },
  /* Render the watch head off-screen at an arbitrary resolution (for product shots and icons). */
  renderHi(px, now = new Date()) {
    const keep = { cv: this.cv, ctx: this.ctx, W: this.W, dpr: this.dpr, R: this.R, r: this.r, layers: this.layers, sub: this.sub, moonAp: this.moonAp, tourbAp: this.tourbAp, secTween: this.secTween, secDisp: this.secDisp, secSrc: this.secSrc };
    const c = document.createElement('canvas'); c.width = c.height = px;
    Object.assign(this, { cv: c, ctx: c.getContext('2d'), W: 1000, dpr: px / 1000, R: 375, r: 300, hi: true, secTween: null });
    try { this.build(); this.render(now); } finally { this.hi = false; Object.assign(this, keep); }
    return c;
  },
  snapshot(size = 900) {
    const c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d');
    x.fillStyle = this.theme.bg; x.fillRect(0, 0, size, size); x.drawImage(this.cv, 0, 0, size, size); return c;
  }
};
function star(ctx, x, y, s, col) {
  ctx.save(); ctx.translate(x, y); ctx.fillStyle = col; ctx.beginPath();
  for (let k = 0; k < 10; k++) { const a = k / 10 * TAU, rr = k % 2 ? s * 0.42 : s; ctx.lineTo(Math.sin(a) * rr, -Math.cos(a) * rr); }
  ctx.closePath(); ctx.fill(); ctx.restore();
}
