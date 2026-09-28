/* Tourbillon: a one-minute rotating carriage carrying the escapement, drawn procedurally. Used on the dial and in the close-up. */
'use strict';
const Tourbillon = {
  cache: {},
  plate(R, mini) {
    const key = Math.round(R) + (mini ? 'm' : 'f') + this.sd(); if (this.cache[key]) return this.cache[key];
    const d = this.sd(), s = Math.ceil(R * 2 * d), c = document.createElement('canvas'); c.width = c.height = s;
    const x = c.getContext('2d'); x.scale(d, d); x.translate(R, R);
    const bg = x.createRadialGradient(-R * 0.2, -R * 0.3, 0, 0, 0, R); bg.addColorStop(0, '#50545a'); bg.addColorStop(1, '#141518'); x.fillStyle = bg; x.beginPath(); x.arc(0, 0, R, 0, TAU); x.fill();
    const ps = R * (mini ? 0.16 : 0.1);
    for (let yy = -R; yy < R + ps; yy += ps * 0.72) for (let xx = -R + (Math.round(yy / (ps * 0.72)) % 2) * ps * 0.5; xx < R + ps; xx += ps * 0.72) {
      const g = x.createRadialGradient(xx - ps * 0.2, yy - ps * 0.2, 0, xx, yy, ps * 0.5); g.addColorStop(0, 'rgba(255,255,255,.22)'); g.addColorStop(0.6, 'rgba(160,165,170,.08)'); g.addColorStop(1, 'rgba(0,0,0,.25)');
      x.beginPath(); x.arc(xx, yy, ps * 0.5, 0, TAU); x.fillStyle = g; x.fill();
    }
    // fixed seconds wheel (the carriage rolls around it)
    const rr = R * 0.9, n = 80; x.beginPath();
    for (let k = 0; k < n; k++) { const a = k / n * TAU, da = TAU / n; x.lineTo(Math.cos(a) * rr * 0.95, Math.sin(a) * rr * 0.95); x.lineTo(Math.cos(a + da * 0.2) * rr, Math.sin(a + da * 0.2) * rr); x.lineTo(Math.cos(a + da * 0.5) * rr, Math.sin(a + da * 0.5) * rr); x.lineTo(Math.cos(a + da * 0.7) * rr * 0.95, Math.sin(a + da * 0.7) * rr * 0.95); }
    x.closePath(); x.arc(0, 0, rr * 0.86, 0, TAU, true); const gg = x.createLinearGradient(-R, -R, R, R); gg.addColorStop(0, '#ffe7a6'); gg.addColorStop(0.5, '#b5883a'); gg.addColorStop(1, '#f0cf82'); x.fillStyle = gg; x.fill('evenodd');
    const vg = x.createRadialGradient(0, 0, R * 0.7, 0, 0, R); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)'); x.fillStyle = vg; x.beginPath(); x.arc(0, 0, R, 0, TAU); x.fill();
    return (this.cache[key] = c);
  },
  /* the carriage's static parts are drawn once into sprites and simply rotated with the cage each frame */
  sprite(kind, R, mini) {
    const key = kind + Math.round(R * 10) + (mini ? 'm' : 'f') + (Watch.theme.accent || '') + (Watch.hi ? 'h' : '') + this.sd(); if (this.cache[key]) return this.cache[key];
    const d = this.sd(), pad = 1.15, s = Math.ceil(R * 2 * pad * d), c = document.createElement('canvas'); c.width = c.height = s;
    const x = c.getContext('2d'); x.scale(d, d); x.translate(R * pad, R * pad); const cr = R * 0.8, lw = Math.max(0.8, R * 0.012);
    if (kind === 'lower') { x.beginPath(); x.arc(0, 0, cr, 0, TAU); x.arc(0, 0, cr * 0.9, 0, TAU, true); x.fillStyle = this.steel(x, cr); x.fill('evenodd'); }
    else {
      // upper carriage: three polished arms with black-polished bevels, one tipped as a seconds pointer
      x.save(); x.shadowColor = 'rgba(0,0,0,.55)'; x.shadowBlur = R * 0.06; x.shadowOffsetY = R * 0.03;
      for (let k = 0; k < 3; k++) {
        x.save(); x.rotate(k * TAU / 3 - Math.PI / 2);
        // slim skeletonised arm: a lyre-shaped outline with an open slot so the balance shows through
        x.beginPath(); x.moveTo(R * 0.12, -R * 0.05); x.bezierCurveTo(R * 0.36, -R * 0.1, R * 0.6, -R * 0.02, cr * 1.0, -R * 0.034); x.lineTo(cr * 1.0, R * 0.034); x.bezierCurveTo(R * 0.6, R * 0.02, R * 0.36, R * 0.1, R * 0.12, R * 0.05); x.closePath();
        x.moveTo(R * 0.24, 0); x.bezierCurveTo(R * 0.34, -R * 0.06, R * 0.5, -R * 0.02, R * 0.62, 0); x.bezierCurveTo(R * 0.5, R * 0.02, R * 0.34, R * 0.06, R * 0.24, 0); x.closePath();
        const ag = x.createLinearGradient(0, -R * 0.07, 0, R * 0.07); ag.addColorStop(0, '#f7f9fb'); ag.addColorStop(0.45, '#9aa1a9'); ag.addColorStop(0.55, '#2a2e34'); ag.addColorStop(1, '#d9dde2'); x.fillStyle = ag; x.fill('evenodd');
        x.shadowColor = 'transparent'; x.lineWidth = lw; x.strokeStyle = 'rgba(255,255,255,.55)'; x.stroke();
        if (k === 0) { x.beginPath(); x.moveTo(cr * 1.02, 0); x.lineTo(cr * 0.88, -R * 0.034); x.lineTo(cr * 0.88, R * 0.034); x.closePath(); x.fillStyle = Watch.theme.accent || '#c1272d'; x.fill(); }
        x.restore();
      }
      x.beginPath(); x.arc(0, 0, R * 0.12, 0, TAU); x.fillStyle = this.steel(x, R * 0.12, true); x.fill(); x.restore();
      x.beginPath(); x.arc(0, 0, R * 0.065, 0, TAU); const jg = x.createRadialGradient(-R * 0.02, -R * 0.02, 0, 0, 0, R * 0.065); jg.addColorStop(0, '#ff9aa8'); jg.addColorStop(0.6, '#c0142e'); jg.addColorStop(1, '#5c0012'); x.fillStyle = jg; x.fill();
      x.beginPath(); x.arc(-R * 0.02, -R * 0.022, R * 0.018, 0, TAU); x.fillStyle = 'rgba(255,255,255,.8)'; x.fill();
      // blued screws on the upper carriage ring
      x.beginPath(); x.arc(0, 0, cr, 0, TAU); x.lineWidth = R * 0.045; x.strokeStyle = this.steel(x, cr); x.stroke();
      for (let k = 0; k < 3; k++) { const a = k * TAU / 3 - Math.PI / 2; const sx = Math.cos(a) * cr, sy = Math.sin(a) * cr, s = R * 0.035; const sg = x.createRadialGradient(sx - s * 0.3, sy - s * 0.3, 0, sx, sy, s); sg.addColorStop(0, '#9fb6ff'); sg.addColorStop(0.5, '#2c4fb8'); sg.addColorStop(1, '#0c1a4d'); x.beginPath(); x.arc(sx, sy, s, 0, TAU); x.fillStyle = sg; x.fill(); }
    }
    c.pad = pad; return (this.cache[key] = c);
  },
  blit(ctx, c, R) { const S = R * 2 * c.pad; ctx.drawImage(c, -S / 2, -S / 2, S, S); },
  /* t in seconds; opts: {mini, speed(balance), bridge, metal} */
  draw(ctx, cx, cy, R, t, o = {}) {
    const mini = !!o.mini, cage = (t % 60) / 60 * TAU, f = 4;
    ctx.save(); ctx.translate(cx, cy); ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.clip();
    if (!o.noPlate) { const pl = this.plate(R, mini); ctx.drawImage(pl, -R, -R, R * 2, R * 2); }
    ctx.rotate(cage);
    const cr = R * 0.8, lw = Math.max(0.8, R * 0.012);
    this.blit(ctx, this.sprite('lower', R, mini), R);
    // escape wheel on the carriage, meshing with the fixed wheel
    const ex = R * 0.52, ey = 0, er = R * 0.2, beats = Math.floor(t * f * 2), ph = t * f * 2 - beats, stepA = (beats + Math.min(1, ph / 0.15)) * TAU / 30;
    ctx.save(); ctx.translate(ex, ey); ctx.rotate(-stepA - cage * 4);
    ctx.beginPath(); for (let k = 0; k < 15; k++) { const a = k / 15 * TAU; ctx.lineTo(Math.cos(a) * er * 0.68, Math.sin(a) * er * 0.68); ctx.lineTo(Math.cos(a + 0.14) * er, Math.sin(a + 0.14) * er); ctx.lineTo(Math.cos(a + 0.26) * er * 0.72, Math.sin(a + 0.26) * er * 0.72); }
    ctx.closePath(); ctx.fillStyle = this.steel(ctx, er, true); ctx.fill(); ctx.beginPath(); ctx.arc(0, 0, er * 0.2, 0, TAU); ctx.fillStyle = '#c0142e'; ctx.fill(); ctx.restore();
    // pallet lever
    const fork = 0.22 * Math.tanh(6 * Math.sin(TAU * f * t));
    ctx.save(); ctx.translate(R * 0.3, R * 0.06); ctx.rotate(Math.PI + fork); ctx.fillStyle = '#d4d8de';
    ctx.beginPath(); ctx.moveTo(0, -R * 0.03); ctx.lineTo(R * 0.24, -R * 0.015); ctx.lineTo(R * 0.24, R * 0.015); ctx.lineTo(0, R * 0.03); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-R * 0.02, -R * 0.1); ctx.lineTo(R * 0.02, -R * 0.02); ctx.lineTo(R * 0.02, R * 0.02); ctx.lineTo(-R * 0.02, R * 0.1); ctx.lineWidth = R * 0.025; ctx.strokeStyle = '#d4d8de'; ctx.stroke();
    ctx.fillStyle = '#c0142e'; ctx.fillRect(-R * 0.04, -R * 0.12, R * 0.03, R * 0.04); ctx.fillRect(-R * 0.04, R * 0.08, R * 0.03, R * 0.04); ctx.restore();
    // balance (with motion ghosts) and hairspring at the carriage centre
    const amp = 1.45 * Math.PI, bal = (tt) => amp * Math.sin(TAU * f * tt), br = R * 0.44, ghosts = mini ? Math.min(2, Perf.q.ghosts) : Perf.q.ghosts;
    const hsN = Perf.level === 0 ? 150 : 220; ctx.beginPath(); for (let i = 0; i <= hsN; i++) { const rho = i / hsN, rad = R * 0.03 + rho * br * 0.55, th = rho * 9 * TAU + bal(t) * (1 - rho) * 0.9; ctx.lineTo(Math.cos(th) * rad, Math.sin(th) * rad); }
    ctx.strokeStyle = 'rgba(80,110,210,.9)'; ctx.lineWidth = Math.max(0.5, R * 0.006); ctx.stroke();
    for (let g = ghosts - 1; g >= 0; g--) {
      ctx.save(); ctx.globalAlpha = g ? 0.16 : 1; ctx.rotate(bal(t - g * 0.007));
      const bg = ctx.createRadialGradient(-br * 0.3, -br * 0.3, br * 0.4, 0, 0, br); bg.addColorStop(0, '#fff2c6'); bg.addColorStop(1, '#a37b28');
      ctx.beginPath(); ctx.arc(0, 0, br, 0, TAU); ctx.arc(0, 0, br * 0.84, 0, TAU, true); ctx.fillStyle = bg; ctx.fill('evenodd');
      for (let k = 0; k < 2; k++) { ctx.save(); ctx.rotate(k * Math.PI); ctx.fillStyle = '#c9a24a'; ctx.fillRect(-br * 0.04, -br * 0.86, br * 0.08, br * 0.86); ctx.restore(); }
      if (!g) for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + 0.3; ctx.beginPath(); ctx.arc(Math.sin(a) * br * 1.03, -Math.cos(a) * br * 1.03, br * 0.055, 0, TAU); ctx.fillStyle = '#ecc86e'; ctx.fill(); }
      ctx.restore();
    }
    this.blit(ctx, this.sprite('upper', R, mini), R);
    ctx.restore();
    // fixed bridge and sapphire rim shadow do not move: cache them once per size/metal/quality and blit
    this.blitTop(ctx, cx, cy, R, o);
  },
  sd() { return Math.min(typeof Perf !== 'undefined' && Perf.dpr ? Perf.dpr() : (devicePixelRatio || 1), 2.5) * (Watch.hi ? 2 : 1); },
  blitTop(ctx, cx, cy, R, o) {
    const M = o.metal || Watch.M(), d = this.sd(), key = 'top' + Math.round(R * 10) + (o.bridge !== false ? 'b' : '') + M.join('') + (Perf.q.blur ? 'z' : '') + (o.gloss ? 'g' : '') + d;
    let c = this.cache[key];
    if (!c) {
      c = this.cache[key] = document.createElement('canvas'); c.width = c.height = Math.ceil(R * 2 * d); const x = c.getContext('2d'); x.scale(d, d);
      this.drawTop(x, R, R, R, o, M);
      if (o.gloss) { const g = x.createRadialGradient(R * 0.7, R * 0.6, 0, R * 0.7, R * 0.6, R * 1.2); g.addColorStop(0, 'rgba(255,255,255,.12)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.beginPath(); x.arc(R, R, R, 0, TAU); x.fill(); }
    }
    ctx.drawImage(c, cx - R, cy - R, R * 2, R * 2);
  },
  drawTop(ctx, cx, cy, R, o, M) {
    // fixed bridge across the aperture (dial side), not rotating
    if (o.bridge !== false) {
      ctx.save(); ctx.translate(cx, cy); ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.clip();
      if (Perf.q.blur) { ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = R * 0.08; ctx.shadowOffsetY = R * 0.04; }
      ctx.beginPath(); ctx.moveTo(-R * 1.05, R * 0.2); ctx.bezierCurveTo(-R * 0.6, R * 0.12, -R * 0.3, -R * 0.02, -R * 0.12, -R * 0.08); ctx.arc(0, 0, R * 0.16, Math.PI * 1.1, Math.PI * 1.9); ctx.bezierCurveTo(R * 0.3, -R * 0.02, R * 0.6, R * 0.12, R * 1.05, R * 0.2);
      ctx.lineTo(R * 1.05, R * 0.36); ctx.bezierCurveTo(R * 0.6, R * 0.26, R * 0.3, R * 0.14, R * 0.14, R * 0.1); ctx.arc(0, 0, R * 0.17, Math.PI * 0.2, Math.PI * 0.8); ctx.bezierCurveTo(-R * 0.3, R * 0.14, -R * 0.6, R * 0.26, -R * 1.05, R * 0.36); ctx.closePath();
      const bgd = ctx.createLinearGradient(0, -R * 0.2, 0, R * 0.4); bgd.addColorStop(0, M[0]); bgd.addColorStop(0.4, M[1]); bgd.addColorStop(0.7, M[4]); bgd.addColorStop(1, M[3]); ctx.fillStyle = bgd; ctx.fill();
      ctx.shadowColor = 'transparent'; ctx.lineWidth = Math.max(0.7, R * 0.012); ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, R * 0.02, R * 0.05, 0, TAU); ctx.fillStyle = '#c0142e'; ctx.fill(); ctx.beginPath(); ctx.arc(-R * 0.015, R * 0.005, R * 0.015, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fill();
      ctx.restore();
    }
    // sapphire depth: inner shadow at the aperture rim
    ctx.save(); ctx.translate(cx, cy); const sh = ctx.createRadialGradient(0, 0, R * 0.78, 0, 0, R); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,.6)'); ctx.fillStyle = sh; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill(); ctx.restore();
  },
  steel(ctx, r, bright) { const g = ctx.createLinearGradient(-r, -r, r, r); g.addColorStop(0, bright ? '#ffffff' : '#e9edf1'); g.addColorStop(0.45, '#8d949c'); g.addColorStop(0.55, '#c9ced4'); g.addColorStop(1, '#5d646c'); return g; }
};
