/* Exhibition case back: engraved ring + animated Calibre C-1991 (gear train, escapement, balance, rotor). */
'use strict';
const CaseBack = {
  cv: null, ctx: null, W: 0, dpr: 1, R: 0, w: 0, layers: {}, speed: 1, simT: 0, lastReal: 0,
  rotor: { a: 0.6, v: 0 }, power: Store.get('power', 0.82), grav: null, dragV: 0,
  init(canvas) { this.cv = canvas; this.ctx = canvas.getContext('2d'); this.resize(); },
  resize() {
    const css = this.cv.clientWidth || 600; this.dpr = Perf.dpr();
    this.W = css; this.cv.width = Math.round(css * this.dpr); this.cv.height = Math.round(css * this.dpr);
    this.R = css * 0.375; this.w = this.R * 0.74; this.layers = {};
  },
  mk() { const c = document.createElement('canvas'); c.width = this.cv.width; c.height = this.cv.height; const x = c.getContext('2d'); x.scale(this.dpr, this.dpr); x.translate(this.W / 2, this.W / 2); return [c, x]; },
  build() {
    const M = Watch.M(), R = this.R, w = this.w, E = CaseBack.engraving();
    // —— case back ring ——
    const [c1, x] = this.mk();
    x.save(); x.shadowColor = 'rgba(0,0,0,.75)'; x.shadowBlur = R * 0.3; x.shadowOffsetY = R * 0.1; x.beginPath(); x.arc(0, 0, R * 0.99, 0, TAU); x.fillStyle = '#000'; x.fill(); x.restore();
    // lugs (mirrored, simplified)
    [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(([sx, sy]) => { x.save(); x.scale(sx, sy); const lx = R * 0.5, lw = R * 0.15;
      const g = x.createLinearGradient(lx, 0, lx + lw * 1.4, 0); g.addColorStop(0, M[2]); g.addColorStop(0.4, M[1]); g.addColorStop(0.7, M[3]); g.addColorStop(1, M[4]);
      x.beginPath(); x.moveTo(lx, -R * 0.7); x.lineTo(lx, -R * 1.2); x.quadraticCurveTo(lx, -R * 1.24, lx + lw * 0.4, -R * 1.24); x.lineTo(lx + lw * 1.05, -R * 1.04); x.lineTo(lx + lw * 1.45, -R * 0.7); x.closePath(); x.fillStyle = g; x.fill(); x.restore(); });
    x.beginPath(); x.arc(0, 0, R, 0, TAU); x.fillStyle = metalConic(x, 0, 0, M, 1.1); x.fill();
    // brushed back ring (circular graining)
    const ro = R * 0.95, ri = w * 1.06;
    x.beginPath(); x.arc(0, 0, ro, 0, TAU); x.arc(0, 0, ri, 0, TAU, true); x.fillStyle = metalConic(x, 0, 0, [M[1], M[5], M[3], M[1], M[2], M[5]], 0.4); x.fill('evenodd');
    for (let k = ri; k < ro; k += 0.9) { x.beginPath(); x.arc(0, 0, k, 0, TAU); x.strokeStyle = `rgba(${Math.random() < 0.5 ? '255,255,255' : '0,0,0'},${Math.random() * 0.06})`; x.lineWidth = 0.6; x.stroke(); }
    // opener notches
    for (let k = 0; k < 6; k++) { x.save(); x.rotate(k / 6 * TAU + Math.PI / 6); x.fillStyle = 'rgba(0,0,0,.5)'; roundRect(x, -R * 0.035, -ro - 1, R * 0.07, R * 0.035, 3); x.fill(); x.fillStyle = 'rgba(255,255,255,.25)'; x.fillRect(-R * 0.035, -ro + R * 0.034, R * 0.07, 0.8); x.restore(); }
    const eng = (fn) => { x.save(); x.translate(0.7, 0.9); x.fillStyle = 'rgba(255,255,255,.4)'; fn(); x.restore(); x.save(); x.fillStyle = 'rgba(25,20,16,.78)'; fn(); x.restore(); };
    const mid = (ro + ri) / 2;
    eng(() => {
      x.font = `700 ${R * 0.058}px Cinzel, serif`; arcText(x, 'CINCO CORPORATION', 0, 0, mid, 0, R * 0.02);
      const ef = CaseBack.engraveFont(E.font, R), txt = E.font === 'roman' ? E.text.toUpperCase() : E.text;
      x.font = ef.font; let sp = ef.sp; while (sp > -R * 0.004 && [...txt].reduce((s2, ch) => s2 + x.measureText(ch).width + sp, 0) > mid * Math.PI * 0.8) sp -= R * 0.002;
      let fs = parseFloat(ef.font.match(/([\d.]+)px/)[1]); while ([...txt].reduce((s2, ch) => s2 + x.measureText(ch).width + sp, 0) > mid * Math.PI * 0.86 && fs > R * 0.03) { fs *= 0.94; x.font = ef.font.replace(/[\d.]+px/, fs + 'px'); }
      arcText(x, txt, 0, 0, mid - R * (E.font === 'script' ? 0.005 : 0), Math.PI, sp, true);
      x.font = `600 ${R * 0.03}px Cinzel, serif`; arcText(x, 'CALIBRE C-1991 · 42 RUBIS', 0, 0, mid, -Math.PI / 2, R * 0.01);
      x.font = `600 ${R * 0.03}px Cinzel, serif`; arcText(x, E.date ? E.date : 'Nº 0417 / 1000 · 30 M', 0, 0, mid, Math.PI / 2, R * 0.01);
      for (let k = 0; k < 4; k++) star(x, Math.sin(k * TAU / 4 + TAU / 8) * mid, -Math.cos(k * TAU / 4 + TAU / 8) * mid, R * 0.02, x.fillStyle);
    });
    x.beginPath(); x.arc(0, 0, ri, 0, TAU); x.lineWidth = R * 0.02; x.strokeStyle = metalConic(x, 0, 0, [M[0], M[2], M[3], M[4]], 0); x.stroke();
    this.layers.ring = c1;
    // —— main plate (perlage) ——
    const [c2, p] = this.mk(); p.save(); p.beginPath(); p.arc(0, 0, w, 0, TAU); p.clip();
    const plate = ['#cfd2d6', '#8d9299'];
    p.fillStyle = plate[1]; p.fillRect(-w, -w, 2 * w, 2 * w);
    const ps = w * 0.07;
    for (let yy = -w; yy < w + ps; yy += ps * 0.72) for (let xx = -w + ((Math.round(yy / (ps * 0.72))) % 2) * ps * 0.5; xx < w + ps; xx += ps * 0.72) {
      const g = p.createRadialGradient(xx - ps * 0.2, yy - ps * 0.2, 0, xx, yy, ps * 0.5); g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(0.5, 'rgba(200,205,210,.25)'); g.addColorStop(1, 'rgba(60,65,70,.35)');
      p.beginPath(); p.arc(xx, yy, ps * 0.5, 0, TAU); p.fillStyle = g; p.fill();
    }
    p.restore(); this.layers.plate = c2;
    // —— bridges (Côtes de Genève, anglage, jewels, screws) ——
    const [c3, b] = this.mk();
    const gold = ['#f6dc9a', '#b88a3c'];
    const bridge = (pathFn) => {
      b.save(); pathFn(); b.shadowColor = 'rgba(0,0,0,.55)'; b.shadowBlur = w * 0.04; b.shadowOffsetY = w * 0.015; b.fillStyle = '#9aa0a6'; b.fill(); b.restore();
      b.save(); pathFn(); b.clip(); b.fillStyle = '#b9bec4'; b.fillRect(-w, -w, 2 * w, 2 * w);
      b.save(); b.rotate(-0.5); for (let s = -w * 1.5, i = 0; s < w * 1.5; s += w * 0.085, i++) { const g = b.createLinearGradient(s, 0, s + w * 0.085, 0); g.addColorStop(0, '#8c9298'); g.addColorStop(0.5, '#f1f3f5'); g.addColorStop(1, '#8c9298'); b.fillStyle = g; b.fillRect(s, -w * 1.5, w * 0.085, w * 3); } b.restore();
      b.restore();
      b.save(); pathFn(); b.lineWidth = w * 0.018; b.strokeStyle = 'rgba(255,255,255,.85)'; b.stroke(); b.lineWidth = w * 0.006; b.strokeStyle = 'rgba(60,64,70,.8)'; b.stroke(); b.restore();
    };
    const jewel = (jx, jy, s = w * 0.028) => {
      const g0 = b.createRadialGradient(jx, jy, 0, jx, jy, s * 1.9); g0.addColorStop(0, gold[0]); g0.addColorStop(1, gold[1]); b.beginPath(); b.arc(jx, jy, s * 1.9, 0, TAU); b.fillStyle = g0; b.fill();
      const g = b.createRadialGradient(jx - s * 0.3, jy - s * 0.3, 0, jx, jy, s); g.addColorStop(0, '#ff9aa8'); g.addColorStop(0.5, '#c0142e'); g.addColorStop(1, '#5c0012'); b.beginPath(); b.arc(jx, jy, s, 0, TAU); b.fillStyle = g; b.fill();
      b.beginPath(); b.arc(jx - s * 0.3, jy - s * 0.35, s * 0.25, 0, TAU); b.fillStyle = 'rgba(255,255,255,.8)'; b.fill(); b.beginPath(); b.arc(jx, jy, s * 0.22, 0, TAU); b.fillStyle = '#2a0006'; b.fill();
    };
    const screw = (sx, sy, a = Math.random() * 3, s = w * 0.035) => {
      const g = b.createRadialGradient(sx - s * 0.3, sy - s * 0.3, 0, sx, sy, s); g.addColorStop(0, '#9fb6ff'); g.addColorStop(0.5, '#2c4fb8'); g.addColorStop(1, '#0c1a4d');
      b.beginPath(); b.arc(sx, sy, s, 0, TAU); b.fillStyle = g; b.fill(); b.save(); b.translate(sx, sy); b.rotate(a); b.fillStyle = 'rgba(5,10,30,.85)'; b.fillRect(-s, -s * 0.14, s * 2, s * 0.28); b.restore();
    };
    this.G = { barrel: [-0.34 * w, 0.4 * w, 0.33 * w], center: [0, 0, 0.2 * w], third: [-0.37 * w, -0.06 * w, 0.16 * w], fourth: [-0.2 * w, -0.42 * w, 0.14 * w], escape: [0.05 * w, -0.53 * w, 0.1 * w], pallet: [0.19 * w, -0.46 * w], balance: [0.44 * w, -0.28 * w, 0.23 * w] };
    const G = this.G;
    const arm = (x0, y0, x1, y1, w0, w1) => () => { const a = Math.atan2(y1 - y0, x1 - x0), nx = -Math.sin(a), ny = Math.cos(a), mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
      b.beginPath(); b.moveTo(x0 + nx * w0 * w, y0 + ny * w0 * w); b.quadraticCurveTo(mx + nx * (w0 + w1) * 0.42 * w, my + ny * (w0 + w1) * 0.42 * w, x1 + nx * w1 * w, y1 + ny * w1 * w);
      b.arc(x1, y1, w1 * w, a + Math.PI / 2, a - Math.PI / 2, true); b.quadraticCurveTo(mx - nx * (w0 + w1) * 0.42 * w, my - ny * (w0 + w1) * 0.42 * w, x0 - nx * w0 * w, y0 - ny * w0 * w); b.closePath(); };
    // barrel bridge (lower left)
    bridge(() => { b.beginPath(); b.moveTo(-0.92 * w, 0.08 * w); b.bezierCurveTo(-0.97 * w, 0.6 * w, -0.6 * w, 0.92 * w, -0.18 * w, 0.84 * w); b.bezierCurveTo(0.06 * w, 0.76 * w, 0.06 * w, 0.46 * w, -0.08 * w, 0.3 * w); b.bezierCurveTo(-0.28 * w, 0.12 * w, -0.6 * w, 0.03 * w, -0.92 * w, 0.08 * w); b.closePath(); });
    bridge(arm(-0.97 * w, 0.02 * w, G.third[0], G.third[1], 0.09, 0.06));
    bridge(arm(-0.8 * w, -0.55 * w, G.fourth[0], G.fourth[1], 0.09, 0.055));
    bridge(arm(-0.2 * w, -0.97 * w, G.escape[0], G.escape[1], 0.075, 0.045));
    bridge(arm(0.36 * w, -0.9 * w, G.pallet[0], G.pallet[1], 0.06, 0.04));
    bridge(arm(0.97 * w, 0.18 * w, G.balance[0], G.balance[1], 0.14, 0.065)); // balance cock
    jewel(G.third[0], G.third[1]); jewel(G.fourth[0], G.fourth[1], w * 0.024); jewel(G.escape[0], G.escape[1], w * 0.02); jewel(G.balance[0], G.balance[1], w * 0.026); jewel(G.pallet[0], G.pallet[1], w * 0.018);
    jewel(G.barrel[0] + 0.02 * w, G.barrel[1] - 0.02 * w, w * 0.03); jewel(-0.62 * w, 0.62 * w, w * 0.02);
    [[-0.86 * w, 0.03 * w], [-0.7 * w, -0.5 * w], [-0.16 * w, -0.85 * w], [0.33 * w, -0.8 * w], [0.82 * w, 0.12 * w], [-0.8 * w, 0.5 * w], [-0.25 * w, 0.72 * w]].forEach(([sx, sy]) => screw(sx, sy));
    b.save(); b.fillStyle = 'rgba(20,20,24,.72)'; b.textAlign = 'center';
    b.save(); b.translate(-0.45 * w, 0.5 * w); b.rotate(0.55); b.font = `600 ${w * 0.042}px Cinzel, serif`; b.fillText('CINCO CORPORATION', 0, 0); b.font = `600 ${w * 0.03}px Cinzel, serif`; b.fillText('ADJUSTED · FIVE POSITIONS', 0, w * 0.06); b.restore();
    b.save(); b.translate(0.73 * w, -0.03 * w); b.rotate(Math.atan2(G.balance[1] - 0.18 * w, G.balance[0] - 0.97 * w) + Math.PI); b.font = `600 ${w * 0.03}px Cinzel, serif`; b.fillText('Nº 0417', 0, w * 0.012); b.restore();
    b.restore();
    this.layers.bridges = c3;
    // gear sprites
    const gearSprite = (rad, teeth, spokes, col) => {
      const s = Math.ceil(rad * 2.3 * this.dpr), c = document.createElement('canvas'); c.width = c.height = s; const g = c.getContext('2d'); g.scale(this.dpr, this.dpr); g.translate(s / 2 / this.dpr, s / 2 / this.dpr);
      g.beginPath(); const th = rad * 0.08;
      for (let k = 0; k < teeth; k++) { const a0 = k / teeth * TAU, a1 = (k + 0.5) / teeth * TAU, da = TAU / teeth;
        g.lineTo(Math.sin(a0) * (rad - th), -Math.cos(a0) * (rad - th)); g.lineTo(Math.sin(a0 + da * 0.12) * rad, -Math.cos(a0 + da * 0.12) * rad); g.lineTo(Math.sin(a1 - da * 0.12) * rad, -Math.cos(a1 - da * 0.12) * rad); g.lineTo(Math.sin(a1) * (rad - th), -Math.cos(a1) * (rad - th)); }
      g.closePath(); const gg = g.createRadialGradient(-rad * 0.3, -rad * 0.3, 0, 0, 0, rad); gg.addColorStop(0, col[0]); gg.addColorStop(1, col[1]); g.fillStyle = gg; g.fill();
      g.save(); g.globalCompositeOperation = 'destination-out';
      for (let k = 0; k < spokes; k++) { const a = k / spokes * TAU, sp = TAU / spokes; g.beginPath(); g.arc(0, 0, rad * 0.78, a + 0.18, a + sp - 0.18); g.arc(0, 0, rad * 0.28, a + sp - 0.4, a + 0.4, true); g.closePath(); g.fill(); }
      g.restore();
      for (let k = rad * 0.3; k < rad * 0.8; k += 1.4) { g.beginPath(); g.arc(0, 0, k, 0, TAU); g.strokeStyle = 'rgba(255,255,255,.05)'; g.stroke(); }
      g.beginPath(); g.arc(0, 0, rad * 0.14, 0, TAU); g.fillStyle = '#7a7f86'; g.fill();
      return c;
    };
    const brass = ['#ffe6a8', '#b2872f'];
    this.sprites = { barrel: gearSprite(G.barrel[2], 72, 5, brass), center: gearSprite(G.center[2], 64, 4, brass), third: gearSprite(G.third[2], 56, 4, brass), fourth: gearSprite(G.fourth[2], 48, 4, brass), escape: this.escSprite(G.escape[2]) };
    // pre-blurred shadow sprites: no canvas shadowBlur at run time, which is the costliest thing a phone GPU can be asked for per frame
    this.shadows = {}; Object.keys(this.sprites).forEach(k => { this.shadows[k] = this.shadowOf(this.sprites[k], w * 0.03); });
    this.sprites.balance = this.balSprite(G.balance[2]); this.shadows.balance = this.shadowOf(this.sprites.balance, 6);
    this.sprites.rotor = this.rotorSprite(); this.shadows.rotor = this.shadowOf(this.sprites.rotor, w * 0.06);
    this.layers.built = this.key();
  },
  /* the blurred silhouette of a sprite, rendered once (the shadow is thrown off-canvas and only its blur lands in view) */
  shadowOf(src, blur) {
    const d = this.dpr, pad = Math.ceil(blur * 2.2 * d), c = document.createElement('canvas'); c.width = src.width + pad * 2; c.height = src.height + pad * 2; const x = c.getContext('2d');
    x.shadowColor = 'rgba(0,0,0,.55)'; x.shadowBlur = blur * d; x.shadowOffsetX = c.width * 2; x.drawImage(src, pad - c.width * 2, pad); c.pad = pad; return c;
  },
  blit(ctx, sp, x, y, ang, sh, ox = 0, oy = 0) {
    const d = this.dpr;
    if (sh) { ctx.save(); ctx.translate(x + ox, y + oy); ctx.rotate(ang); ctx.drawImage(sh, -sh.width / 2 / d, -sh.height / 2 / d, sh.width / d, sh.height / d); ctx.restore(); }
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.drawImage(sp, -sp.width / 2 / d, -sp.height / 2 / d, sp.width / d, sp.height / d); ctx.restore();
  },
  balSprite(br) {
    const d = this.dpr, s = Math.ceil(br * 2.3 * d), c = document.createElement('canvas'); c.width = c.height = s; const x = c.getContext('2d'); x.scale(d, d); x.translate(s / 2 / d, s / 2 / d);
    const g = x.createRadialGradient(-br * 0.3, -br * 0.3, br * 0.5, 0, 0, br); g.addColorStop(0, '#fff0c0'); g.addColorStop(1, '#a8802c');
    x.beginPath(); x.arc(0, 0, br, 0, TAU); x.arc(0, 0, br * 0.84, 0, TAU, true); x.fillStyle = g; x.fill('evenodd');
    x.beginPath(); x.arc(0, 0, br * 0.995, -2.2, -0.9); x.strokeStyle = 'rgba(255,255,255,.55)'; x.lineWidth = 0.8; x.stroke();
    for (let k = 0; k < 3; k++) { x.save(); x.rotate(k * TAU / 3); x.fillStyle = '#c9a24a'; x.fillRect(-br * 0.035, -br * 0.86, br * 0.07, br * 0.86); x.restore(); }
    for (let k = 0; k < 8; k++) { const a = k * TAU / 8 + 0.2, sx = Math.sin(a) * br * 1.02, sy = -Math.cos(a) * br * 1.02, sg = x.createRadialGradient(sx - br * 0.015, sy - br * 0.015, 0, sx, sy, br * 0.05); sg.addColorStop(0, '#fff3c8'); sg.addColorStop(1, '#b8902f'); x.beginPath(); x.arc(sx, sy, br * 0.05, 0, TAU); x.fillStyle = sg; x.fill(); }
    x.beginPath(); x.arc(0, 0, br * 0.12, 0, TAU); x.fillStyle = '#d9b457'; x.fill();
    x.beginPath(); x.arc(0, -br * 0.2, br * 0.035, 0, TAU); x.fillStyle = '#c0142e'; x.fill();
    return c;
  },
  rotorSprite() {
    const d = this.dpr, w = this.w, s = Math.ceil(w * 2.05 * d), c = document.createElement('canvas'); c.width = c.height = s; const x = c.getContext('2d'); x.scale(d, d); x.translate(s / 2 / d, s / 2 / d);
    const g = x.createLinearGradient(-w, 0, w, 0); g.addColorStop(0, '#f8e2a4'); g.addColorStop(0.3, '#c69b45'); g.addColorStop(0.55, '#fff0c4'); g.addColorStop(0.8, '#b6893a'); g.addColorStop(1, '#f1d38c');
    x.beginPath(); x.arc(0, 0, w * 0.97, Math.PI * 0.08, Math.PI * 0.92); x.arc(0, 0, w * 0.62, Math.PI * 0.92, Math.PI * 0.08, true); x.closePath(); x.fillStyle = g; x.fill();
    // Côtes circulaires on the weight
    x.save(); x.clip(); for (let k = w * 0.63; k < w * 0.97; k += w * 0.035) { x.beginPath(); x.arc(0, w * 0.1, k, 0, TAU); x.strokeStyle = 'rgba(120,80,20,.16)'; x.lineWidth = w * 0.012; x.stroke(); } x.restore();
    [0.28, 0.5, 0.72].forEach(k => { x.save(); x.rotate(Math.PI * k - Math.PI / 2); x.fillStyle = g; roundRect(x, -w * 0.035, 0, w * 0.07, w * 0.64, w * 0.02); x.fill(); x.restore(); });
    x.beginPath(); x.arc(0, 0, w * 0.11, 0, TAU); x.fillStyle = g; x.fill(); x.beginPath(); x.arc(0, 0, w * 0.04, 0, TAU); x.fillStyle = '#8c97b0'; x.fill();
    x.fillStyle = 'rgba(70,45,10,.7)'; x.font = `700 ${w * 0.062}px Cinzel, serif`; arcText(x, 'CINCO CORPORATION', 0, 0, w * 0.795, Math.PI, w * 0.012, true);
    return c;
  },
  escSprite(rad) {
    const s = Math.ceil(rad * 2.3 * this.dpr), c = document.createElement('canvas'); c.width = c.height = s; const g = c.getContext('2d'); g.scale(this.dpr, this.dpr); g.translate(s / 2 / this.dpr, s / 2 / this.dpr);
    g.beginPath(); for (let k = 0; k < 20; k++) { const a = k / 20 * TAU; g.lineTo(Math.sin(a) * rad * 0.7, -Math.cos(a) * rad * 0.7); g.lineTo(Math.sin(a + 0.12) * rad, -Math.cos(a + 0.12) * rad); g.lineTo(Math.sin(a + 0.2) * rad * 0.72, -Math.cos(a + 0.2) * rad * 0.72); }
    g.closePath(); const gg = g.createRadialGradient(0, 0, 0, 0, 0, rad); gg.addColorStop(0, '#e9eef5'); gg.addColorStop(1, '#8c95a3'); g.fillStyle = gg; g.fill();
    g.save(); g.globalCompositeOperation = 'destination-out'; for (let k = 0; k < 4; k++) { const a = k / 4 * TAU; g.beginPath(); g.arc(0, 0, rad * 0.55, a + 0.25, a + TAU / 4 - 0.25); g.arc(0, 0, rad * 0.2, a + TAU / 4 - 0.5, a + 0.5, true); g.closePath(); g.fill(); } g.restore();
    return c;
  },
  key() { const E = this.engraving(); return Watch.metal() + '|' + E.text + '|' + E.font + '|' + E.date; },
  engraving() { const e = Settings.engrave || {}; return { text: (e.text || '').trim() || 'for a mind of refined taste', font: e.font || 'script', date: (e.date || '').trim() }; },
  engraveFont(f, R) { return f === 'roman' ? { font: `600 ${R * 0.045}px Cinzel, serif`, sp: R * 0.014 } : f === 'type' ? { font: `${R * 0.05}px "Special Elite", monospace`, sp: R * 0.004 } : { font: `${R * 0.07}px "Pinyon Script", cursive`, sp: R * 0.002 }; },
  wind(amount) { const was = this.power; this.power = clamp(this.power + amount, 0, 1); if (!this._ps || performance.now() - this._ps > 1000) { Store.set('power', this.power); this._ps = performance.now(); } if (this.power >= 0.999 && was < 0.999) Bus.emit('ach', 'wound'); },
  render(now) {
    if (!this.layers.ring || this.layers.built !== this.key()) this.build();
    const ctx = this.ctx, w = this.w, G = this.G, S = this.sprites;
    const real = performance.now() / 1000, dt = Math.min(0.05, this.lastReal ? real - this.lastReal : 0.016); this.lastReal = real;
    this.simT += dt * this.speed;
    this.power = clamp(this.power - dt * 0.0000064, 0, 1); // ~42h reserve
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, this.cv.width, this.cv.height);
    ctx.drawImage(this.layers.ring, 0, 0);
    ctx.save(); ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); ctx.translate(this.W / 2, this.W / 2);
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, w, 0, TAU); ctx.clip();
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(this.layers.plate, 0, 0); ctx.setTransform(this.dpr, 0, 0, this.dpr, this.W / 2 * this.dpr, this.W / 2 * this.dpr);
    const f = 4, t = this.simT, amp = (0.55 + 0.45 * this.power) * 1.5 * Math.PI * (this.power > 0.01 ? 1 : 0);
    const beats = Math.floor(t * f * 2), phaseInBeat = t * f * 2 - beats, ease = Math.min(1, phaseInBeat / 0.12);
    const step = beats + ease - (phaseInBeat < 0.12 ? 0 : 0);
    const sh = Perf.q.blur ? this.shadows : {}, oy = w * 0.012;
    const draw = (k, pos, ang) => this.blit(ctx, S[k], pos[0], pos[1], ang, sh[k], 0, oy);
    draw('barrel', G.barrel, -step * TAU / 400000);
    draw('center', G.center, step * TAU / 28800);
    draw('third', G.third, -step * TAU / 3600);
    draw('fourth', G.fourth, step * TAU / 480);
    draw('escape', G.escape, -step * TAU / 40);
    ctx.save();
    // pallet fork
    const fork = 0.2 * Math.tanh(6 * Math.sin(TAU * f * t));
    ctx.save(); ctx.translate(G.pallet[0], G.pallet[1]); ctx.rotate(Math.atan2(G.balance[1] - G.pallet[1], G.balance[0] - G.pallet[0]) + Math.PI + fork);
    ctx.fillStyle = '#c9ced6'; ctx.beginPath(); ctx.moveTo(-w * 0.012, 0); ctx.lineTo(-w * 0.22, -w * 0.04); ctx.lineTo(-w * 0.235, -w * 0.012); ctx.lineTo(-w * 0.2, -w * 0.01); ctx.lineTo(-w * 0.2, w * 0.012); ctx.lineTo(-w * 0.235, w * 0.014); ctx.lineTo(-w * 0.22, w * 0.04); ctx.lineTo(0, w * 0.018); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(0, -w * 0.02); ctx.lineTo(w * 0.1, -w * 0.07); ctx.lineTo(w * 0.12, -w * 0.05); ctx.lineTo(w * 0.02, 0); ctx.lineTo(w * 0.12, w * 0.07); ctx.lineTo(w * 0.1, w * 0.09); ctx.lineTo(0, w * 0.03); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#c0142e'; ctx.fillRect(w * 0.1, -w * 0.075, w * 0.022, w * 0.03); ctx.fillRect(w * 0.1, w * 0.065, w * 0.022, w * 0.03);
    ctx.restore(); ctx.restore();
    // balance wheel (+ motion ghosts at real speed)
    const bal = (tt) => amp * Math.sin(TAU * f * tt);
    const ghosts = this.speed > 0.5 ? Perf.q.ghosts : 1;
    for (let gI = ghosts - 1; gI >= 0; gI--) { ctx.globalAlpha = gI === 0 ? 1 : 0.18; this.drawBalance(ctx, bal(t - gI * 0.006 * this.speed), gI === 0); }
    ctx.globalAlpha = 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(this.layers.bridges, 0, 0); ctx.setTransform(this.dpr, 0, 0, this.dpr, this.W / 2 * this.dpr, this.W / 2 * this.dpr);
    this.drawRotor(ctx, dt);
    // sapphire glare
    const L = Watch.light, hx = Math.sin(L) * w * 0.5, hy = -Math.cos(L) * w * 0.5, g = ctx.createRadialGradient(hx, hy, 0, hx, hy, w);
    g.addColorStop(0, 'rgba(255,255,255,.14)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(-w, -w, 2 * w, 2 * w);
    const e = ctx.createRadialGradient(0, 0, w * 0.85, 0, 0, w); e.addColorStop(0, 'rgba(0,0,0,0)'); e.addColorStop(1, 'rgba(0,0,0,.5)'); ctx.fillStyle = e; ctx.fillRect(-w, -w, 2 * w, 2 * w);
    ctx.restore(); ctx.restore();
    this.amp = amp;
  },
  drawBalance(ctx, ang, full) {
    const [bx, by, br] = this.G.balance, w = this.w;
    if (full) { // hairspring breathes with the balance
      ctx.save(); ctx.translate(bx, by); ctx.beginPath(); const turns = 11, n = Perf.q.spring;
      for (let i = 0; i <= n; i++) { const rho = i / n, rad = w * 0.02 + rho * br * 0.55, th = rho * turns * TAU + ang * (1 - rho) * 0.9; ctx.lineTo(Math.cos(th) * rad, Math.sin(th) * rad); }
      ctx.strokeStyle = 'rgba(60,90,190,.9)'; ctx.lineWidth = 0.7; ctx.stroke(); ctx.restore();
    }
    this.blit(ctx, this.sprites.balance, bx, by, ang, full && Perf.q.blur ? this.shadows.balance : null, 0, 3);
  },
  drawRotor(ctx, dt) {
    const w = this.w, ro = this.rotor;
    // gravity pull (device tilt or default "down"), plus user fling
    const gAng = this.grav != null ? this.grav : 0; // angle the heavy side wants to point
    let d = ((gAng - ro.a) % TAU + TAU * 1.5) % TAU - Math.PI;
    ro.v += (Math.sin(d) * 6 - ro.v * 1.4) * dt + this.dragV; this.dragV = 0;
    const prev = ro.a; ro.a += ro.v * dt; this.wind(Math.abs(ro.a - prev) * 0.004);
    this.blit(ctx, this.sprites.rotor, 0, 0, ro.a, Perf.q.blur ? this.shadows.rotor : null, 0, w * 0.02);
  }
};
