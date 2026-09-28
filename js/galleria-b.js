/* Ring III · Galleria — VII. Chess · VIII. Library · IX. Florence sketches · X. Anniversaries · XI. Tides · XII. Atelier */
'use strict';
ACH.push(['harpsichordist', 'At the keyboard', 'Played the house harpsichord.', 'The Galleria has an instrument.'],
  ['wound', 'Fully wound', 'Wound the mainspring from empty to full.', 'Forty turns of the crown.'],
  ['mate', 'Checkmate', 'Solved a chess problem of the day.', 'The board in the Galleria.'],
  ['atelier', 'Watchmaker', 'Watched the watch assembled in the atelier.', 'Every piece in its place.']);
{ const g = ACH.find(a => a[0] === 'grand'); if (g) g[2] = 'Visited every page on all three rings.'; }

/* ——— VII. Chess problem of the day (positions verified with a chess engine: every solution is the only one) ——— */
const PUZZLES = [{"name": "The back rank", "fen": "6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1", "n": 1, "sol": ["a1a8"]}, {"name": "Smothered", "fen": "6rk/6pp/8/6N1/8/8/8/6K1 w - - 0 1", "n": 1, "sol": ["g5f7"]}, {"name": "The Arabian", "fen": "7k/R7/5N2/8/8/8/8/6K1 w - - 0 1", "n": 1, "sol": ["a7h7"]}, {"name": "Four moves, one lesson", "fen": "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4", "n": 1, "sol": ["h5f7"]}, {"name": "A hasty opening", "fen": "rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq - 0 2", "n": 1, "sol": ["d8h4"]}, {"name": "The sacrifice", "fen": "r1b2k1r/ppp1bppp/8/1B1Q4/5q2/2P5/PPP2PPP/R3R1K1 w - - 1 1", "n": 2, "sol": ["d5d8", "e7d8"], "mates": ["e1e8"]}, {"name": "Epaulettes", "fen": "3rkr2/8/8/8/2Q5/8/8/6K1 w - - 0 1", "n": 1, "sol": ["c4e6"]}, {"name": "Two rooks", "fen": "7k/1R6/8/8/8/8/8/R5K1 w - - 0 1", "n": 1, "sol": ["a1a8"]}, {"name": "The queen gives herself", "fen": "r6k/6pp/7N/8/8/1Q6/8/6K1 w - - 0 1", "n": 2, "sol": ["b3g8", "a8g8"], "mates": ["h6f7"]}, {"name": "An open file", "fen": "2r3k1/5ppp/8/8/8/8/5PPP/2R1R1K1 w - - 0 1", "n": 1, "sol": ["c1c8"]}];
const PIECE = { K: '♚', Q: '♛', R: '♜', B: '♝', N: '♞', P: '♟', k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };
MODES.push({
  id: 'chess', page: 3, name: 'Scacchi', label: 'Chess', kicker: 'Galleria VII', icon: 'chess', sub: 'A problem of the day from the doctor’s board. Find the checkmate.',
  build(el) {
    el.innerHTML = `<div class="cz-head"><b id="cz-name"></b><small id="cz-task"></small></div><div class="cz-board" id="cz-board" role="grid" aria-label="Chess board"></div>
      <div class="btn-row"><button class="btn" id="cz-prev">‹ Previous</button><button class="btn" id="cz-next">Next ›</button><button class="btn" id="cz-hint">Hint</button><button class="btn ghost" id="cz-reset">Start again</button></div>
      <p class="fine" id="cz-msg">Tap a piece, then the square it should go to.</p>`;
    this.i = Math.floor(Date.now() / 86400000) % PUZZLES.length;
    $('#cz-prev', el).onclick = () => { this.i = (this.i + PUZZLES.length - 1) % PUZZLES.length; this.load(); };
    $('#cz-next', el).onclick = () => { this.i = (this.i + 1) % PUZZLES.length; this.load(); };
    $('#cz-reset', el).onclick = () => this.load(); $('#cz-hint', el).onclick = () => this.hint();
    $('#cz-board', el).onclick = (e) => { const b = e.target.closest('button[data-sq]'); if (b) this.tap(b.dataset.sq); };
    this.load();
  },
  load() {
    const P = PUZZLES[this.i], rows = P.fen.split(' ')[0].split('/'); this.side = P.fen.split(' ')[1]; this.board = {}; this.step = 0; this.sel = null; this.done = false; this.hints = 0;
    rows.forEach((r, ri) => { let f = 0; for (const ch of r) { if (/\d/.test(ch)) f += +ch; else { this.board['abcdefgh'[f] + (8 - ri)] = ch; f++; } } });
    $('#cz-name').textContent = `No. ${this.i + 1} · ${P.name}`; $('#cz-task').textContent = `${this.side === 'w' ? 'White' : 'Black'} to move and mate in ${P.n}${this.i === Math.floor(Date.now() / 86400000) % PUZZLES.length ? ' · today’s problem' : ''}`;
    this.msg('Tap a piece, then the square it should go to.'); this.render();
  },
  msg(t) { const m = $('#cz-msg'); if (m) m.textContent = t; },
  render(last) {
    const flip = this.side === 'b', B = $('#cz-board'); let h = '';
    for (let r = 0; r < 8; r++) for (let f = 0; f < 8; f++) { const rank = flip ? r + 1 : 8 - r, file = flip ? 7 - f : f, sq = 'abcdefgh'[file] + rank, p = this.board[sq], dark = (file + rank) % 2 === 0;
      const cls = ['sq', dark ? 'dk' : 'lt', this.sel === sq ? 'sel' : '', last && last.includes(sq) ? 'last' : '', this.hl === sq ? 'hint' : ''].join(' ');
      h += `<button class="${cls}" data-sq="${sq}" aria-label="${sq}${p ? ' ' + p : ''}">${p ? `<span class="pc ${p === p.toUpperCase() ? 'wp' : 'bp'}">${PIECE[p]}&#xFE0E;</span>` : ''}${f === 0 ? `<i class="rk">${rank}</i>` : ''}${r === 7 ? `<i class="fl">${'abcdefgh'[file]}</i>` : ''}</button>`; }
    B.innerHTML = h;
  },
  own(p) { return p && (this.side === 'w' ? p === p.toUpperCase() : p === p.toLowerCase()); },
  tap(sq) {
    if (this.done || this.busy) return; const p = this.board[sq];
    if (!this.sel) { if (this.own(p)) { this.sel = sq; Snd.play && Snd.play('detent', 0, 0.3); this.render(); } return; }
    if (this.own(p)) { this.sel = sq; this.render(); return; }
    const mv = this.sel + sq, P = PUZZLES[this.i], want = P.n === 2 && this.step === 1 ? P.mates : [P.sol[this.step === 0 ? 0 : 2]];
    const ok = this.step === 0 ? mv === P.sol[0] : want.includes(mv);
    if (!ok) { this.sel = null; this.render(); this.msg('A reasonable idea, but not the one. Try again.'); Snd.play && Snd.play('pushUp', 0, 0.3); Haptics.tap('double'); return; }
    this.move(mv); this.sel = null; Haptics.tap('press');
    if (P.n === 1 || this.step === 1) { this.done = true; this.render([mv.slice(0, 2), mv.slice(2)]); this.msg(this.hints ? 'Checkmate. With a little help, but checkmate.' : 'Checkmate. Elegantly done.'); Snd.gong(740, 0, 0.35); Snd.gong(988, (Snd.ctx ? Snd.ctx.currentTime : 0) + 0.35, 0.3); Bus.emit('ach', 'mate'); return; }
    this.step = 1; this.render([mv.slice(0, 2), mv.slice(2)]); this.msg('Good. The reply comes…'); this.busy = true;
    setTimeout(() => { this.busy = false; const r = P.sol[1]; this.move(r); this.render([r.slice(0, 2), r.slice(2)]); Snd.play && Snd.play('detent', 0, 0.3); this.msg('And now finish it.'); }, 700);
  },
  move(mv) { const a = mv.slice(0, 2), b = mv.slice(2, 4); this.board[b] = this.board[a]; delete this.board[a]; Snd.play && Snd.play('pushDown', 0, 0.3); },
  hint() { const P = PUZZLES[this.i], mv = this.step === 0 ? P.sol[0] : P.mates[0]; this.hints++; this.hl = mv.slice(0, 2); this.render(); this.hl = null; this.msg(this.hints > 1 ? `The move is ${mv.slice(0, 2)} to ${mv.slice(2)}.` : 'The highlighted piece is the one to move.'); if (this.hints > 1) { this.sel = mv.slice(0, 2); this.render(); } }
});

/* ——— VIII. Library of public-domain words ——— */
const LIBRARY = [
  ['Dante Alighieri', 'Inferno, I (tr. Longfellow)', 'Midway upon the journey of our life / I found myself within a forest dark, / For the straightforward pathway had been lost.'],
  ['Dante Alighieri', 'Inferno, III (tr. Longfellow)', 'All hope abandon, ye who enter in!'],
  ['Dante Alighieri', 'Inferno, XXVI (tr. Longfellow)', 'Ye were not made to live like unto brutes, / But for pursuit of virtue and of knowledge.'],
  ['Dante Alighieri', 'Inferno, XXXIV (tr. Longfellow)', 'Thence we came forth to rebehold the stars.'],
  ['Dante Alighieri', 'Paradiso, XXXIII (tr. Longfellow)', 'The Love which moves the sun and the other stars.'],
  ['Marcus Aurelius', 'Meditations, IV (tr. George Long)', 'The universe is transformation: life is opinion.'],
  ['Marcus Aurelius', 'Meditations, VII (tr. George Long)', 'Very little is needed to make a happy life.'],
  ['Marcus Aurelius', 'Meditations, IX (tr. George Long)', 'Loss is nothing else than change.'],
  ['Marcus Aurelius', 'Meditations, X (tr. George Long)', 'No longer talk at all about the kind of man that a good man ought to be, but be such.'],
  ['Seneca', 'Letters to Lucilius, I (tr. Gummere)', 'Nothing, Lucilius, is ours, except time.'],
  ['Seneca', 'Letters to Lucilius, I (tr. Gummere)', 'While we are postponing, life speeds by.'],
  ['Horace', 'Odes, I.11', 'Carpe diem, quam minimum credula postero. (Seize the day, and trust as little as you can in tomorrow.)'],
  ['Virgil', 'Georgics, III', 'Sed fugit interea, fugit inreparabile tempus. (But meanwhile it flies: time flies, never to be regained.)'],
  ['Niccolò Machiavelli', 'The Prince, XVII (tr. Marriott)', 'It is much safer to be feared than loved, when, of the two, either must be dispensed with.'],
  ['William Shakespeare', 'Julius Caesar', 'The fault, dear Brutus, is not in our stars, / But in ourselves, that we are underlings.'],
  ['William Shakespeare', 'Richard II', 'I wasted time, and now doth time waste me.'],
  ['William Shakespeare', 'Othello', 'How poor are they that have not patience!'],
  ['William Shakespeare', 'As You Like It', 'Time is the old justice that examines all such offenders, and let Time try.'],
  ['Blaise Pascal', 'Pensées (tr. Trotter)', 'The heart has its reasons, which reason does not know.'],
  ['Blaise Pascal', 'Provincial Letters, XVI', 'I have made this longer than usual because I have not had time to make it shorter.'],
  ['Benjamin Franklin', 'Poor Richard’s Almanack', 'Dost thou love life? Then do not squander time, for that’s the stuff life is made of.'],
  ['Benjamin Franklin', 'Poor Richard’s Almanack', 'Lost time is never found again.'],
  ['William Blake', 'Auguries of Innocence', 'To see a World in a Grain of Sand / And a Heaven in a Wild Flower, / Hold Infinity in the palm of your hand / And Eternity in an hour.'],
  ['John Keats', 'Ode on a Grecian Urn', 'Beauty is truth, truth beauty, that is all / Ye know on earth, and all ye need to know.'],
  ['Edgar Allan Poe', 'A Dream Within a Dream', 'All that we see or seem / Is but a dream within a dream.'],
  ['Oscar Wilde', 'Lady Windermere’s Fan', 'We are all in the gutter, but some of us are looking at the stars.']
];
MODES.push({
  id: 'library', page: 3, name: 'Biblioteca', label: 'Library', kicker: 'Galleria VIII', icon: 'library', sub: 'Lines from the doctor’s shelves: Dante, the Stoics, Shakespeare and others, all long in the public domain.',
  build(el) {
    const authors = [...new Set(LIBRARY.map(q => q[0]))];
    el.innerHTML = `<div class="chips" id="lb-auth"><button class="chip on" data-a="">All</button>${authors.map(a => `<button class="chip" data-a="${esc(a)}">${esc(a.split(' ').slice(-1)[0])}</button>`).join('')}<button class="chip" data-a="★">★ Kept</button></div>
      <blockquote class="lb-q" id="lb-q"></blockquote>
      <div class="btn-row"><button class="btn" id="lb-prev">‹</button><button class="btn primary" id="lb-rand">Another</button><button class="btn" id="lb-next">›</button><button class="btn" id="lb-fav">☆ Keep</button><button class="btn" id="lb-say">Read aloud</button></div>
      <p class="fine" id="lb-count"></p>`;
    this.filter = ''; this.favs = Store.get('libFavs', []); this.k = Math.floor(Date.now() / 86400000) % LIBRARY.length;
    $('#lb-auth', el).onclick = (e) => { const b = e.target.closest('button[data-a]'); if (!b) return; this.filter = b.dataset.a; $$('#lb-auth button').forEach(x => x.classList.toggle('on', x === b)); const L = this.list(); if (!L.includes(this.k)) this.k = L[0]; this.render(); };
    $('#lb-prev', el).onclick = () => this.nav(-1); $('#lb-next', el).onclick = () => this.nav(1);
    $('#lb-rand', el).onclick = () => { const L = this.list(); if (L.length > 1) { let n; do { n = pick(L); } while (n === this.k); this.k = n; } this.render(); };
    $('#lb-fav', el).onclick = () => { const i = this.favs.indexOf(this.k); if (i >= 0) this.favs.splice(i, 1); else this.favs.push(this.k); Store.set('libFavs', this.favs); this.render(); };
    $('#lb-say', el).onclick = () => { Voice.pick(); if (!Voice.speak(LIBRARY[this.k][2].replace(/ \/ /g, ', '), true)) toast('Speech is not available in this browser'); };
  },
  list() { const L = LIBRARY.map((q, i) => i).filter(i => !this.filter || (this.filter === '★' ? this.favs.includes(i) : LIBRARY[i][0] === this.filter)); return L.length ? L : [this.k]; },
  nav(d) { const L = this.list(), p = L.indexOf(this.k); this.k = L[((p < 0 ? 0 : p) + d + L.length) % L.length]; this.render(); },
  render() {
    const [a, w, t] = LIBRARY[this.k], q = $('#lb-q'); if (!q) return;
    q.innerHTML = `<p>${t.split(' / ').map(esc).join('<br>')}</p><footer><b>${esc(a)}</b><cite>${esc(w)}</cite></footer>`; q.classList.remove('in'); void q.offsetWidth; q.classList.add('in');
    $('#lb-fav').textContent = this.favs.includes(this.k) ? '★ Kept' : '☆ Keep'; $('#lb-count').textContent = `${LIBRARY.length} passages from ${new Set(LIBRARY.map(x => x[0])).size} authors · ${this.favs.length} kept. Translations are the public-domain ones named under each passage.`;
  },
  show() { this.render(); }
});

/* ——— IX. Florence: charcoal sketches in parallax layers ——— */
const Charcoal = {
  rng: mulberry32(7),
  line(x, a, b, c, d, w = 1, al = 0.8) { const r = this.rng; x.lineCap = 'round'; for (let k = 0; k < 2; k++) { x.globalAlpha = al * (k ? 0.45 : 1); x.lineWidth = w * (k ? 0.6 : 1); x.beginPath(); x.moveTo(a + (r() - 0.5) * 1.4, b + (r() - 0.5) * 1.4); const mx = (a + c) / 2 + (r() - 0.5) * 2, my = (b + d) / 2 + (r() - 0.5) * 2; x.quadraticCurveTo(mx, my, c + (r() - 0.5) * 1.4, d + (r() - 0.5) * 1.4); x.stroke(); } x.globalAlpha = 1; },
  rect(x, l, t, w, h, lw = 1) { this.line(x, l, t, l + w, t, lw); this.line(x, l + w, t, l + w, t + h, lw); this.line(x, l + w, t + h, l, t + h, lw); this.line(x, l, t + h, l, t, lw); },
  hatch(x, path, ang, gap, al = 0.35, lw = 0.7) { x.save(); path(); x.clip(); const W = x.canvas.width, c = Math.cos(ang), s = Math.sin(ang); x.globalAlpha = al; x.lineWidth = lw;
    for (let d = -W * 2; d < W * 2; d += gap) { x.beginPath(); x.moveTo(-W * c - d * s, -W * s + d * c); x.lineTo(W * 3 * c - d * s, W * 3 * s + d * c); x.stroke(); } x.restore(); x.globalAlpha = 1; },
  cypress(x, cx, by, h, w) { const p = () => { x.beginPath(); x.moveTo(cx, by - h); x.quadraticCurveTo(cx + w, by - h * 0.55, cx + w * 0.35, by); x.lineTo(cx - w * 0.35, by); x.quadraticCurveTo(cx - w, by - h * 0.55, cx, by - h); };
    x.fillStyle = 'rgba(38,32,26,.55)'; p(); x.fill(); this.hatch(x, p, 1.2, 2.4, 0.5, 0.8); this.line(x, cx, by - h, cx + w * 0.35, by, 0.8, 0.6); },
  arch(x, l, b, w, h, lw = 1) { x.lineWidth = lw; x.globalAlpha = 0.8; x.beginPath(); x.moveTo(l, b); x.lineTo(l, b - h + w / 2); x.arc(l + w / 2, b - h + w / 2, w / 2, Math.PI, 0); x.lineTo(l + w, b); x.stroke(); x.globalAlpha = 1; },
  paper(x, w, h, tint) { x.fillStyle = tint || '#ece2cc'; x.fillRect(0, 0, w, h); const r = this.rng; for (let i = 0; i < w * h / 90; i++) { x.fillStyle = `rgba(90,70,40,${r() * 0.06})`; x.fillRect(r() * w, r() * h, 1 + r() * 1.5, 1 + r() * 1.5); }
    x.strokeStyle = 'rgba(60,45,30,.18)'; for (let c = 0; c < 3; c++) { const cy = h * (0.1 + r() * 0.22), cx0 = w * r(); for (let k = 0; k < 7; k++) this.line(x, cx0 + k * 9, cy + (k % 2) * 3, cx0 + k * 9 + w * 0.12, cy + (k % 2) * 3 - 2, 0.6, 0.5); }
    x.strokeStyle = 'rgba(40,30,20,.6)'; for (let b = 0; b < 4; b++) { const bx = w * (0.6 + r() * 0.35), by = h * (0.08 + r() * 0.15), s = 3 + r() * 3; x.lineWidth = 0.9; x.beginPath(); x.moveTo(bx - s, by); x.quadraticCurveTo(bx - s / 2, by - s * 0.6, bx, by); x.quadraticCurveTo(bx + s / 2, by - s * 0.6, bx + s, by); x.stroke(); }
    const v = x.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, w * 0.75); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(70,45,20,.28)'); x.fillStyle = v; x.fillRect(0, 0, w, h); },
  hills(x, w, base, amp, seed, al) { const r = mulberry32(seed); x.beginPath(); x.moveTo(0, base); for (let i = 0; i <= 24; i++) x.lineTo(i / 24 * w, base - amp * (0.5 + 0.5 * Math.sin(i * 0.7 + seed) * 0.6 + r() * 0.25)); x.lineTo(w, base + 400); x.lineTo(0, base + 400); x.closePath(); x.fillStyle = `rgba(60,50,40,${al})`; x.fill(); }
};
const SCENES = [
  { name: 'Il Duomo', cap: 'Brunelleschi’s dome from a borrowed terrace, drawn while the bells were still ringing.', draw(L, w, h) {
    const [sky, far, mid, near] = L; Charcoal.paper(sky, w, h); far.strokeStyle = mid.strokeStyle = near.strokeStyle = '#2a2420';
    Charcoal.hills(far, w, h * 0.62, h * 0.12, 3, 0.16); for (let i = 0; i < 7; i++) Charcoal.cypress(far, w * (0.05 + i * 0.14), h * 0.6, h * 0.08, h * 0.012);
    const cx = w * 0.56, base = h * 0.66, dw = w * 0.3;
    for (let i = 0; i < 14; i++) { const bx = i / 14 * w, bw = w / 14 + 4, bh = h * (0.06 + ((i * 37) % 9) / 90); mid.fillStyle = 'rgba(236,226,204,1)'; mid.fillRect(bx, base + h * 0.1 - bh, bw, bh + h); Charcoal.rect(mid, bx, base + h * 0.1 - bh, bw, bh + h * 0.3, 0.8); Charcoal.hatch(mid, () => { mid.beginPath(); mid.rect(bx, base + h * 0.1 - bh, bw, h * 0.018); }, 0.3, 2.5, 0.5); }
    mid.fillStyle = 'rgba(236,226,204,1)'; mid.fillRect(cx - dw * 0.55, base - h * 0.1, dw * 1.1, h * 0.2); Charcoal.rect(mid, cx - dw * 0.55, base - h * 0.1, dw * 1.1, h * 0.12, 1.1);
    for (let k = 0; k < 5; k++) { mid.beginPath(); mid.arc(cx - dw * 0.4 + k * dw * 0.2, base - h * 0.045, h * 0.014, 0, TAU); mid.lineWidth = 0.9; mid.stroke(); }
    const dome = () => { mid.beginPath(); mid.moveTo(cx - dw / 2, base - h * 0.1); mid.bezierCurveTo(cx - dw / 2, base - h * 0.32, cx - dw * 0.12, base - h * 0.42, cx, base - h * 0.44); mid.bezierCurveTo(cx + dw * 0.12, base - h * 0.42, cx + dw / 2, base - h * 0.32, cx + dw / 2, base - h * 0.1); mid.closePath(); };
    mid.fillStyle = 'rgba(200,120,90,.28)'; dome(); mid.fill(); Charcoal.hatch(mid, dome, 1.0, 3.2, 0.3); Charcoal.hatch(mid, () => { dome(); mid.clip(); mid.beginPath(); mid.rect(cx + dw * 0.08, base - h * 0.5, dw, h * 0.5); }, 0.6, 2.2, 0.35);
    mid.lineWidth = 1.4; dome(); mid.stroke(); [-0.3, 0, 0.3].forEach(o => Charcoal.line(mid, cx + o * dw, base - h * 0.1, cx + o * dw * 0.15, base - h * 0.435, 1.1));
    mid.fillStyle = 'rgba(236,226,204,1)'; mid.fillRect(cx - w * 0.018, base - h * 0.5, w * 0.036, h * 0.06); Charcoal.rect(mid, cx - w * 0.018, base - h * 0.5, w * 0.036, h * 0.06, 0.9); Charcoal.line(mid, cx - w * 0.02, base - h * 0.5, cx, base - h * 0.55, 0.9); Charcoal.line(mid, cx + w * 0.02, base - h * 0.5, cx, base - h * 0.55, 0.9); mid.beginPath(); mid.arc(cx, base - h * 0.56, 2.5, 0, TAU); mid.stroke();
    const tx = w * 0.24, tw = w * 0.07, top = h * 0.14; mid.fillStyle = 'rgba(236,226,204,1)'; mid.fillRect(tx, top, tw, base - top + h * 0.1); Charcoal.rect(mid, tx, top, tw, base - top + h * 0.05, 1.1);
    for (let k = 1; k < 5; k++) Charcoal.line(mid, tx, top + k * (base - top) / 5, tx + tw, top + k * (base - top) / 5, 0.8); for (let k = 0; k < 3; k++) Charcoal.arch(mid, tx + tw * 0.25, top + (k + 0.9) * (base - top) / 5, tw * 0.5, (base - top) / 7, 0.8);
    Charcoal.rect(mid, tx - 3, top - 5, tw + 6, 5, 1);
    near.fillStyle = 'rgba(40,32,26,.75)'; near.fillRect(0, h * 0.88, w, h * 0.12); for (let i = 0; i < 26; i++) { const bx = i / 26 * w; near.fillRect(bx + 4, h * 0.8, 5, h * 0.08); } near.fillRect(0, h * 0.79, w, 5);
    Charcoal.cypress(near, w * 0.92, h * 0.9, h * 0.34, h * 0.05); } },
  { name: 'Ponte Vecchio', cap: 'The old bridge at dusk, with the goldsmiths’ shutters closing one by one.', draw(L, w, h) {
    const [sky, far, mid, near] = L; Charcoal.paper(sky, w, h, '#e9dfc6'); far.strokeStyle = mid.strokeStyle = near.strokeStyle = '#2a2420';
    Charcoal.hills(far, w, h * 0.5, h * 0.1, 11, 0.14); Charcoal.cypress(far, w * 0.7, h * 0.45, h * 0.07, h * 0.01); Charcoal.rect(far, w * 0.62, h * 0.4, w * 0.05, h * 0.05, 0.7);
    const deck = h * 0.55, water = h * 0.72; mid.fillStyle = 'rgba(236,226,204,1)';
    let x0 = w * 0.04; const r = mulberry32(5); while (x0 < w * 0.96) { const bw = w * (0.035 + r() * 0.04), bh = h * (0.08 + r() * 0.09); mid.fillRect(x0, deck - bh, bw, bh + 2); Charcoal.rect(mid, x0, deck - bh, bw, bh, 0.9);
      for (let k = 0; k < 2; k++) mid.strokeRect(x0 + bw * (0.2 + k * 0.4), deck - bh * 0.7, bw * 0.2, bh * 0.25); if (r() < 0.5) Charcoal.hatch(mid, () => { mid.beginPath(); mid.rect(x0, deck - bh, bw, bh); }, 0.9, 3, 0.25); x0 += bw; }
    mid.fillRect(w * 0.02, deck, w * 0.96, water - deck); Charcoal.line(mid, w * 0.02, deck, w * 0.98, deck, 1.3); Charcoal.line(mid, w * 0.02, deck + h * 0.025, w * 0.98, deck + h * 0.025, 0.8);
    [[0.1, 0.24], [0.38, 0.24], [0.66, 0.24]].forEach(([a, b]) => { const l = w * a, aw = w * b; mid.save(); mid.beginPath(); mid.moveTo(l, water); mid.quadraticCurveTo(l + aw / 2, deck + h * 0.02, l + aw, water); mid.closePath(); mid.fillStyle = 'rgba(60,50,40,.55)'; mid.fill(); mid.restore(); mid.lineWidth = 1.2; mid.beginPath(); mid.moveTo(l, water); mid.quadraticCurveTo(l + aw / 2, deck + h * 0.02, l + aw, water); mid.stroke(); });
    near.strokeStyle = 'rgba(40,32,26,.45)'; for (let i = 0; i < 70; i++) { const y = water + 4 + (i % 14) * h * 0.02, xx = ((i * 97) % 100) / 100 * w; Charcoal.line(near, xx, y, xx + w * 0.06, y, 0.7, 0.5); }
    near.fillStyle = 'rgba(40,32,26,.8)'; near.fillRect(0, h * 0.94, w, h * 0.06); near.fillRect(w * 0.12, h * 0.6, 4, h * 0.34); near.beginPath(); near.arc(w * 0.12 + 2, h * 0.59, 8, 0, TAU); near.fill(); near.fillStyle = 'rgba(255,200,120,.5)'; near.beginPath(); near.arc(w * 0.12 + 2, h * 0.59, 4, 0, TAU); near.fill(); } },
  { name: 'Palazzo Vecchio', cap: 'The tower of the old palace, which has kept Florence’s hours for seven centuries.', draw(L, w, h) {
    const [sky, far, mid, near] = L; Charcoal.paper(sky, w, h); far.strokeStyle = mid.strokeStyle = near.strokeStyle = '#2a2420';
    Charcoal.hatch(far, () => { far.beginPath(); far.rect(0, h * 0.5, w, h * 0.5); }, 0.2, 5, 0.12);
    const l = w * 0.26, t = h * 0.42, pw = w * 0.48, ph = h * 0.46; mid.fillStyle = 'rgba(236,226,204,1)'; mid.fillRect(l, t, pw, ph); Charcoal.rect(mid, l, t, pw, ph, 1.2);
    for (let k = 0; k < 12; k++) Charcoal.rect(mid, l + k * pw / 12 + 2, t - h * 0.03, pw / 24, h * 0.03, 0.8); Charcoal.line(mid, l - 4, t + h * 0.03, l + pw + 4, t + h * 0.03, 1);
    for (let row = 0; row < 2; row++) for (let k = 0; k < 5; k++) Charcoal.arch(mid, l + pw * (0.08 + k * 0.19), t + h * (0.16 + row * 0.13), pw * 0.07, h * 0.08, 0.9);
    Charcoal.hatch(mid, () => { mid.beginPath(); mid.rect(l + pw * 0.6, t, pw * 0.4, ph); }, 0.8, 3, 0.25);
    const tx = l + pw * 0.62, tw = pw * 0.12, tt = h * 0.08; mid.fillRect(tx, tt, tw, t - tt); Charcoal.rect(mid, tx, tt + h * 0.06, tw, t - tt - h * 0.06, 1.1);
    mid.fillRect(tx - tw * 0.2, tt + h * 0.03, tw * 1.4, h * 0.05); Charcoal.rect(mid, tx - tw * 0.2, tt + h * 0.03, tw * 1.4, h * 0.05, 1); for (let k = 0; k < 5; k++) Charcoal.rect(mid, tx - tw * 0.2 + k * tw * 0.3, tt + h * 0.015, tw * 0.15, h * 0.015, 0.7);
    mid.beginPath(); mid.arc(tx + tw / 2, tt + h * 0.14, tw * 0.28, 0, TAU); mid.lineWidth = 1; mid.stroke(); Charcoal.line(mid, tx + tw / 2, tt + h * 0.14, tx + tw / 2, tt + h * 0.115, 0.9); Charcoal.line(mid, tx + tw / 2, tt + h * 0.14, tx + tw * 0.68, tt + h * 0.14, 0.9);
    for (let k = 0; k < 4; k++) Charcoal.line(mid, tx + tw * (0.1 + k * 0.27), tt - h * 0.02, tx + tw * (0.1 + k * 0.27), tt + h * 0.03, 0.8); Charcoal.line(mid, tx, tt - h * 0.02, tx + tw / 2, tt - h * 0.07, 1); Charcoal.line(mid, tx + tw, tt - h * 0.02, tx + tw / 2, tt - h * 0.07, 1);
    near.fillStyle = 'rgba(40,32,26,.78)'; near.fillRect(0, h * 0.9, w, h * 0.1); near.beginPath(); near.moveTo(0, h); near.lineTo(0, h * 0.25); near.quadraticCurveTo(w * 0.1, h * 0.12, w * 0.18, h * 0.25); near.lineTo(w * 0.18, h); near.lineTo(w * 0.15, h); near.lineTo(w * 0.15, h * 0.3); near.quadraticCurveTo(w * 0.09, h * 0.2, w * 0.03, h * 0.3); near.lineTo(w * 0.03, h); near.closePath(); near.fill(); } },
  { name: 'San Miniato al Monte', cap: 'The marble church above the city, and the cypresses that climb the hill towards it.', draw(L, w, h) {
    const [sky, far, mid, near] = L; Charcoal.paper(sky, w, h, '#e6dcc2'); far.strokeStyle = mid.strokeStyle = near.strokeStyle = '#2a2420';
    Charcoal.hills(far, w, h * 0.55, h * 0.16, 21, 0.13); Charcoal.hills(far, w, h * 0.66, h * 0.1, 29, 0.12);
    const cx = w * 0.52, b = h * 0.6, fw = w * 0.3; mid.fillStyle = 'rgba(236,226,204,1)'; mid.beginPath(); mid.moveTo(cx - fw / 2, b); mid.lineTo(cx - fw / 2, b - h * 0.18); mid.lineTo(cx - fw * 0.2, b - h * 0.2); mid.lineTo(cx - fw * 0.2, b - h * 0.3); mid.lineTo(cx, b - h * 0.37); mid.lineTo(cx + fw * 0.2, b - h * 0.3); mid.lineTo(cx + fw * 0.2, b - h * 0.2); mid.lineTo(cx + fw / 2, b - h * 0.18); mid.lineTo(cx + fw / 2, b); mid.closePath(); mid.fill(); mid.lineWidth = 1.2; mid.stroke();
    for (let k = 0; k < 5; k++) Charcoal.arch(mid, cx - fw * 0.45 + k * fw * 0.18, b, fw * 0.12, h * 0.14, 0.9); Charcoal.line(mid, cx - fw / 2, b - h * 0.18, cx + fw / 2, b - h * 0.18, 1);
    for (let k = 0; k < 3; k++) Charcoal.rect(mid, cx - fw * 0.15 + k * fw * 0.1, b - h * 0.28, fw * 0.06, h * 0.07, 0.8); mid.beginPath(); mid.arc(cx, b - h * 0.32, h * 0.012, 0, TAU); mid.stroke();
    const bt = cx + fw * 0.62; mid.fillRect(bt, b - h * 0.34, w * 0.04, h * 0.34); Charcoal.rect(mid, bt, b - h * 0.34, w * 0.04, h * 0.34, 1); Charcoal.hatch(mid, () => { mid.beginPath(); mid.rect(bt, b - h * 0.34, w * 0.04, h * 0.34); }, 1.1, 3, 0.3);
    for (let i = 0; i < 9; i++) Charcoal.cypress(mid, w * (0.08 + i * 0.045), h * (0.9 - i * 0.03), h * (0.2 - i * 0.012), h * 0.022);
    near.fillStyle = 'rgba(40,32,26,.7)'; near.fillRect(0, h * 0.9, w, h * 0.1); for (let i = 0; i < 18; i++) Charcoal.rect(near, i * w / 18, h * 0.86, w / 18, h * 0.04, 0.7);
    Charcoal.cypress(near, w * 0.88, h * 0.95, h * 0.62, h * 0.07); } }
];
MODES.push({
  id: 'florence', page: 3, name: 'Firenze', label: 'Florence', kicker: 'Galleria IX', icon: 'florence', sub: 'A sketchbook from Florence. Move the pointer, or tilt the phone, to look into the drawings.',
  build(el) {
    el.innerHTML = `<div class="fl-frame" id="fl-frame"><div class="fl-stack" id="fl-stack"></div><div class="fl-cap" id="fl-cap"></div></div>
      <div class="btn-row"><button class="btn" id="fl-prev">‹ Previous</button><button class="btn" id="fl-next">Next ›</button><button class="btn" id="fl-tilt" hidden>Enable tilt</button></div>
      <p class="fine">Four sketches drawn by the watch itself in charcoal and sepia, each built from four layers of paper at different depths. Original drawings; no photographs.</p>`;
    this.i = 0; this.px = 0; this.py = 0; this.tx = 0; this.ty = 0; this.cache = {};
    const fr = $('#fl-frame', el); fr.addEventListener('pointermove', (e) => { const r = fr.getBoundingClientRect(); this.tx = ((e.clientX - r.left) / r.width - 0.5) * 2; this.ty = ((e.clientY - r.top) / r.height - 0.5) * 2; this.pointer = performance.now(); });
    fr.addEventListener('pointerleave', () => { this.tx = 0; this.ty = 0; });
    $('#fl-prev', el).onclick = () => this.go(-1); $('#fl-next', el).onclick = () => this.go(1);
    const tb = $('#fl-tilt', el); tb.hidden = !Motion.needs(); tb.onclick = () => Motion.ask();
  },
  go(d) { this.i = (this.i + d + SCENES.length) % SCENES.length; this.render(); Snd.play && Snd.play('whoosh', 0, 0.2); },
  render() {
    const st = $('#fl-stack'); if (!st || !st.clientWidth) return; const w = st.clientWidth, h = st.clientHeight, key = this.i + ':' + w + 'x' + h;
    if (!this.cache[key]) { const d = Math.min(Perf.dpr(), 2), m = 1.12, cvs = [0, 1, 2, 3].map(() => { const c = document.createElement('canvas'); c.width = Math.round(w * m * d); c.height = Math.round(h * m * d); const x = c.getContext('2d'); x.setTransform(d, 0, 0, d, 0, 0); return c; });
      Charcoal.rng = mulberry32(this.i * 31 + 7); SCENES[this.i].draw(cvs.map(c => c.getContext('2d')), w * m, h * m); this.cache[key] = cvs; }
    st.innerHTML = ''; this.layers = this.cache[key]; this.layers.forEach((c, k) => { c.className = 'fl-layer'; c.style.transform = ''; st.appendChild(c); });
    st.classList.remove('in'); void st.offsetWidth; st.classList.add('in');
    $('#fl-cap').innerHTML = `<b>${SCENES[this.i].name}</b> · ${SCENES[this.i].cap}`; this.last = '';
  },
  show() { requestAnimationFrame(() => this.render()); },
  frame(dt) {
    if (!this.layers) return; const tilt = performance.now() - (this.pointer || 0) > 1500; const tx = tilt ? clamp(App.tiltY / 6, -1, 1) : this.tx, ty = tilt ? clamp(-App.tiltX / 4, -1, 1) : this.ty;
    const k = 1 - Math.exp(-dt * 6); this.px += (tx - this.px) * k; this.py += (ty - this.py) * k; const key = (this.px * 200 | 0) + ',' + (this.py * 200 | 0); if (key === this.last) return; this.last = key;
    const depth = [2, 7, 14, 24]; this.layers.forEach((c, i) => { c.style.transform = `translate3d(${(-this.px * depth[i]).toFixed(1)}px, ${(-this.py * depth[i] * 0.6).toFixed(1)}px, 0)`; });
  }
});

/* ——— X. Anniversaries & birthdays ——— */
const Ricorrenze = {
  list() { return Store.get('dates', []); }, save(L) { Store.set('dates', L); Watch.dirtyN = (Watch.dirtyN || 0) + 1; },
  next(e, from = new Date()) { const t = new Date(from.getFullYear(), from.getMonth(), from.getDate()); let d = new Date(t.getFullYear(), e.m, e.d); if (d < t) d = new Date(t.getFullYear() + 1, e.m, e.d); return { date: d, days: Math.round((d - t) / 86400000), years: e.y ? d.getFullYear() - e.y : null }; },
  inMonth(y, m) { const o = {}; this.list().forEach(e => { if (e.m === m) o[e.d] = (o[e.d] ? o[e.d] + ', ' : '') + e.name; }); return o; },
  label(e, n) { const k = { birthday: 'birthday', anniversary: 'anniversary', other: '' }[e.kind] || ''; return `${e.name}${k ? '’s ' + k : ''}${n.years != null && n.years > 0 ? ` (${n.years}${e.kind === 'birthday' ? '' : ' years'})` : ''}`; },
  greet() { const today = this.list().filter(e => this.next(e).days === 0); if (today.length) toast('Today: ' + today.map(e => this.label(e, this.next(e))).join(' · '), 5200); },
  drawDial(ctx, S, now) { // tiny gold pips on the date sub-dial for this month’s occasions
    if (!Settings.remindOnDial) return; const L = this.list(); if (!L.length) return; ctx.save(); ctx.translate(S.x, S.y);
    L.forEach(e => { if (e.m !== now.getMonth()) return; const a = (e.d - 1) / 31 * TAU; ctx.fillStyle = e.d === now.getDate() ? '#ffd27a' : '#c8a96a'; ctx.beginPath(); ctx.arc(Math.sin(a) * S.s * 0.93, -Math.cos(a) * S.s * 0.93, S.s * 0.055, 0, TAU); ctx.fill(); }); ctx.restore(); }
};
document.addEventListener('DOMContentLoaded', () => setTimeout(() => Ricorrenze.greet(), 5000));
MODES.push({
  id: 'dates', page: 3, name: 'Ricorrenze', label: 'Occasions', kicker: 'Galleria X', icon: 'dates', sub: 'Birthdays and anniversaries worth remembering. They appear as gold pips on the date sub-dial.',
  build(el) {
    el.innerHTML = `<div class="rc-form"><input type="text" id="rc-name" maxlength="28" placeholder="Name, e.g. Clarice" aria-label="Name"><input type="date" id="rc-date" aria-label="Date"><select id="rc-kind" aria-label="Kind"><option value="birthday">Birthday</option><option value="anniversary">Anniversary</option><option value="other">Other</option></select><button class="btn primary" id="rc-add">Add</button></div>
      <label class="row-set"><span>Show gold pips on the date sub-dial</span><label class="switch"><input type="checkbox" id="rc-dial"><span></span></label></label>
      <ul class="rc-list" id="rc-list"></ul><p class="fine">Entered years are used to count birthdays and anniversaries. Everything stays in this browser. A reminder appears when you open the watch on the day.</p>`;
    $('#rc-add', el).onclick = () => { const n = $('#rc-name').value.trim(), v = $('#rc-date').value; if (!n || !v) { toast('A name and a date, please'); return; } const [y, m, d] = v.split('-').map(Number); const L = Ricorrenze.list(); L.push({ name: n, y: y > 1900 && y <= new Date().getFullYear() ? y : null, m: m - 1, d, kind: $('#rc-kind').value }); Ricorrenze.save(L); $('#rc-name').value = ''; this.render(); toast('Noted.'); };
    const c = $('#rc-dial', el); c.checked = Settings.remindOnDial; c.onchange = () => setSetting('remindOnDial', c.checked);
    $('#rc-list', el).onclick = (e) => { const b = e.target.closest('button[data-k]'); if (!b) return; const L = Ricorrenze.list(); L.splice(+b.dataset.k, 1); Ricorrenze.save(L); this.render(); };
  },
  render() {
    const L = Ricorrenze.list().map((e, k) => ({ e, k, n: Ricorrenze.next(e) })).sort((a, b) => a.n.days - b.n.days), ul = $('#rc-list'); if (!ul) return;
    ul.innerHTML = L.length ? L.map(({ e, k, n }) => `<li class="${n.days === 0 ? 'today' : ''}"><span class="rc-when"><b>${n.days === 0 ? 'Today' : n.days === 1 ? 'Tomorrow' : 'in ' + n.days + ' days'}</b><small>${n.date.toDateString().slice(4, 10)}</small></span><span class="rc-what">${esc(Ricorrenze.label(e, n))}</span><button class="x" data-k="${k}" aria-label="Remove ${esc(e.name)}">×</button></li>`).join('') : '<li class="empty">Nothing yet. Add a first occasion above.</li>';
  },
  show() { this.render(); }
});

/* ——— XI. Tides & lunar gravitation ——— */
MODES.push({
  id: 'tides', page: 3, name: 'Maree', label: 'Tides', kicker: 'Galleria XI', icon: 'tides', sub: 'The moon’s pull on the seas: an astronomical tide dial with spring and neap tides. For interest only, never for navigation.',
  build(el) {
    el.innerHTML = `<canvas class="gal-cv" id="td-cv" aria-label="Tide dial"></canvas><canvas class="td-curve" id="td-curve" aria-label="Tide curve for the next 24 hours"></canvas>
      <div class="stat-row" id="td-stats"></div>
      <label class="lbl" for="td-off">High-water interval of your harbour: <b id="td-offv"></b></label><input type="range" id="td-off" min="-12" max="12" step="0.25">
      <p class="fine">High water follows the moon’s passage across the meridian by a delay that is different at every coast. Set that delay once (from a local tide table) and the dial keeps pace with the moon. Spring tides come near new and full moon, neap tides near the quarters.</p>`;
    const r = $('#td-off', el); r.value = Settings.tideOffset; r.oninput = () => { setSetting('tideOffset', +r.value); this.draw(); };
  },
  model(now = new Date()) {
    const L = Loc.get(), ph = moonPhase(now).frac, age = ph * 29.53, noon = (AutoTheme.day(now).noon || new Date(new Date(now).setHours(12, 0, 0, 0))).getTime();
    const period = 12.42 * 3600000; let hw = noon + age * 50.47 * 60000 + Settings.tideOffset * 3600000; while (hw > now.getTime()) hw -= period; while (hw + period < now.getTime()) hw += period;
    const spring = Math.cos(ph * 2 * TAU), amp = 1 + 0.35 * spring, level = (t) => Math.cos((t - hw) / period * TAU) * amp;
    return { ph, age, hw, period, amp, spring, level, next: hw + period, low: hw + period / 2 > now.getTime() ? hw + period / 2 : hw + period * 1.5, moonHA: ((now.getTime() - (noon + age * 50.47 * 60000)) / (24.84 * 3600000)) * TAU, L };
  },
  show() { this.draw(); }, tick(now) { if (now.getSeconds() % 10 === 0) this.draw(); },
  draw() {
    const cv = $('#td-cv'); if (!cv || !cv.clientWidth) return; const { x, w } = gcv(cv), T = Watch.theme, now = new Date(), M = this.model(now), cx = w / 2, cy = w / 2, R = w * 0.44;
    galFace(x, cx, cy, R, T); x.fillStyle = T.print; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = `${R * 0.07}px Georgia, serif`;
    x.fillText('HIGH', cx, cy - R * 0.8); x.fillText('LOW', cx, cy + R * 0.8); x.save(); x.font = `${R * 0.05}px Georgia, serif`; x.fillStyle = T.printDim; x.fillText('FALLING', cx + R * 0.78, cy); x.fillText('RISING', cx - R * 0.78, cy); x.restore();
    for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; x.save(); x.translate(cx, cy); x.rotate(a); x.fillRect(-0.7, -R * 0.93, 1.4, k % 3 ? R * 0.04 : R * 0.08); x.restore(); }
    // Earth with its two tidal bulges pointed at the moon; the sun's pull adds or opposes
    const er = R * 0.2, mA = M.moonHA - Math.PI / 2, bul = 0.18 + 0.12 * (M.spring + 1) / 2;
    x.save(); x.translate(cx, cy); x.rotate(mA); x.beginPath(); x.ellipse(0, 0, er * (1 + bul), er * (1 - bul * 0.5), 0, 0, TAU); x.fillStyle = 'rgba(80,140,200,.45)'; x.fill(); x.restore();
    x.beginPath(); x.arc(cx, cy, er * 0.82, 0, TAU); const eg = x.createRadialGradient(cx - er * 0.3, cy - er * 0.3, 1, cx, cy, er); eg.addColorStop(0, '#5a7a58'); eg.addColorStop(1, '#23331f'); x.fillStyle = eg; x.fill();
    x.beginPath(); x.arc(cx, cy - er * 0.82, 2.4, 0, TAU); x.fillStyle = '#fff'; x.fill();
    const md = R * 0.5; x.beginPath(); x.arc(cx + Math.cos(mA) * md, cy + Math.sin(mA) * md, R * 0.06, 0, TAU); x.fillStyle = '#e9e0c4'; x.fill();
    const sA = ((now.getHours() + now.getMinutes() / 60 - 12) / 24) * TAU - Math.PI / 2; x.save(); x.strokeStyle = 'rgba(233,200,120,.8)'; x.lineWidth = 1.5; x.setLineDash([3, 3]); x.beginPath(); x.moveTo(cx + Math.cos(sA) * er * 1.4, cy + Math.sin(sA) * er * 1.4); x.lineTo(cx + Math.cos(sA) * R * 0.66, cy + Math.sin(sA) * R * 0.66); x.stroke(); x.restore();
    x.font = `${R * 0.05}px Georgia, serif`; x.fillStyle = 'rgba(233,200,120,.9)'; x.fillText('☉', cx + Math.cos(sA) * R * 0.7, cy + Math.sin(sA) * R * 0.7);
    const ta = (now.getTime() - M.hw) / M.period * TAU; galHand(x, cx, cy, ta, R * 0.86, R * 0.022, T.accent, 0.08);
    x.beginPath(); x.arc(cx, cy, R * 0.03, 0, TAU); x.fillStyle = T.accent; x.fill();
    const c2 = $('#td-curve'); if (c2 && c2.clientWidth) { const H = c2.clientHeight || 90, { x: y2, w: W } = gcv(c2, H); y2.fillStyle = 'rgba(0,0,0,.25)'; y2.fillRect(0, 0, W, H);
      y2.strokeStyle = 'rgba(200,169,106,.25)'; y2.lineWidth = 1; for (let hh = 0; hh <= 24; hh += 6) { const xx = hh / 24 * W; y2.beginPath(); y2.moveTo(xx, 0); y2.lineTo(xx, H); y2.stroke(); }
      y2.beginPath(); for (let i = 0; i <= 200; i++) { const t = now.getTime() + i / 200 * 86400000, v = M.level(t) / 1.4; const yy = H / 2 - v * H * 0.4; i ? y2.lineTo(i / 200 * W, yy) : y2.moveTo(0, yy); }
      y2.lineTo(W, H); y2.lineTo(0, H); y2.closePath(); const fg = y2.createLinearGradient(0, 0, 0, H); fg.addColorStop(0, 'rgba(90,150,210,.55)'); fg.addColorStop(1, 'rgba(30,60,100,.25)'); y2.fillStyle = fg; y2.fill();
      y2.fillStyle = 'rgba(236,230,216,.7)'; y2.font = '10px ui-monospace, Menlo, monospace'; ['now', '+6h', '+12h', '+18h'].forEach((s, k) => y2.fillText(s, k * W / 4 + 3, 11)); }
    const f = (t) => fmtClock(new Date(t)), st = $('#td-stats'), range = M.spring > 0.5 ? 'Spring tides' : M.spring < -0.5 ? 'Neap tides' : M.spring > 0 ? 'Towards springs' : 'Towards neaps';
    if (st) st.innerHTML = `<div><b class="mono">${f(M.next)}</b><small>next high water</small></div><div><b class="mono">${f(M.low)}</b><small>next low water</small></div><div><b>${range}</b><small>range ×${M.amp.toFixed(2)}</small></div><div><b class="mono">${M.age.toFixed(1)} d</b><small>moon’s age</small></div>`;
    const ov = $('#td-offv'); if (ov) { const o = Settings.tideOffset, hh = Math.trunc(o), mm = Math.round(Math.abs(o - hh) * 60); ov.textContent = `${o >= 0 ? '+' : '−'}${Math.abs(hh)} h ${pad(mm)} m`; }
  }
});

/* ——— XII. Atelier: the watch assembled piece by piece ——— */
MODES.push({
  id: 'atelier', page: 3, name: 'Atelier', label: 'Atelier', kicker: 'Galleria XII', icon: 'atelier', sub: 'The watchmaker’s bench. See the Lecter assembled, from the bare movement to the sealed crystal.',
  STAGES: [['Il movimento', 'Calibre C-1991: 312 parts, 35 jewels, a column wheel and a free-sprung balance.'], ['La cassa', 'The case, turned and hand-finished, receives the movement.'],
    ['Il quadrante', 'The dial is set on its feet, with the sub-dials for seconds, minutes and the date.'], ['Le lancette', 'Hands are fitted in order: hours, minutes, then the long seconds hand.'],
    ['Il vetro', 'The sapphire crystal is pressed home, anti-reflective on both faces.'], ['Regolazione', 'Regulated in six positions and signed by the house of Cinco.']],
  build(el) {
    el.innerHTML = `<canvas class="gal-cv" id="at-cv" aria-label="The watch being assembled"></canvas><div class="at-cap" id="at-cap" aria-live="polite"></div>
      <div class="at-steps" id="at-steps">${this.STAGES.map((s, i) => `<i data-i="${i}" title="${s[0]}"></i>`).join('')}</div>
      <div class="btn-row"><button class="btn primary" id="at-go">Assemble</button><button class="btn" id="at-slow">Slowly</button></div>
      <p class="fine">The parts are the watch’s own rendered layers: the movement from the case back, then the case, dial, hands and crystal of the dial you are wearing.</p>`;
    $('#at-go', el).onclick = () => this.start(1); $('#at-slow', el).onclick = () => this.start(0.5); this.t = null;
  },
  start(speed) { CaseBack.render(new Date()); Watch.render(new Date(), 0.016, true); this.t0 = performance.now(); this.speed = speed; this.stage = -1; this.running = true; Snd.ensure(); },
  show() { this.running = false; this.drawAt(99); const c = $('#at-cap'); if (c) c.innerHTML = '<b>The bench is ready.</b> Press Assemble.'; },
  frame() { if (!this.running) return; const t = (performance.now() - this.t0) / 1000 * this.speed; this.drawAt(t); if (t > 7.4) { this.running = false; Snd.chime(1); Bus.emit('ach', 'atelier'); } },
  drawAt(t) {
    const cv = $('#at-cv'); if (!cv || !cv.clientWidth) return; const { x, w } = gcv(cv), cx = w / 2, cy = w / 2, s = w / Watch.W * 0.92, L = Watch.layers || {};
    const st = Math.min(5, Math.floor(t / 1.2)); if (t < 90 && st !== this.stage) { this.stage = st; const S = this.STAGES[st]; $('#at-cap').innerHTML = `<b>${S[0]}</b> · ${S[1]}`; $$('#at-steps i').forEach((d, i) => d.classList.toggle('on', i <= st)); if (st < 5) Snd.pusher(st % 2); else Snd.ratchet(0.5); Haptics.tap('press'); }
    const ease = (u) => { u = clamp(u, 0, 1); return 1 - Math.pow(1 - u, 3); }, ph = (k) => ease((t - k * 1.2) / 1.0);
    // bench mat
    const bg = x.createRadialGradient(cx, cy, w * 0.1, cx, cy, w * 0.7); bg.addColorStop(0, 'rgba(40,60,50,.35)'); bg.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = bg; x.fillRect(0, 0, w, w);
    const img = (c, u, dy, sc, rot) => { if (!c || u <= 0) return; x.save(); x.globalAlpha = Math.min(1, u * 1.4); x.translate(cx, cy + dy * (1 - u)); x.rotate(rot * (1 - u)); const D = Watch.W * s * (sc + (1 - sc) * u); x.drawImage(c, -D / 2, -D / 2, D, D); x.restore(); };
    const u0 = ph(0), u1 = ph(1), u2 = ph(2), u3 = ph(3), u4 = ph(4), u5 = ph(5);
    if (u1 < 1) img(CaseBack.cv, u0 * (1 - u1 * 0.9), w * 0.25, 0.7, -0.6);
    img(L.case, u1, -w * 0.4, 1.35, 0.25); img(L.dial, u2, -w * 0.3, 1.15, -0.4);
    if (u3 > 0) { x.save(); x.translate(cx, cy); x.scale(s, s); const now = new Date(), r = Watch.r, mins = now.getMinutes() + now.getSeconds() / 60, hrs = (now.getHours() % 12) + mins / 60;
      const hU = ease((t - 3.6) / 0.5), mU = ease((t - 3.9) / 0.5), sU = ease((t - 4.2) / 0.5);
      if (hU > 0) { x.globalAlpha = hU; x.save(); x.translate(0, -w * 0.2 * (1 - hU)); Watch.dauphine(x, hrs / 12 * TAU, r * 0.56, r * 0.052, 3); x.restore(); }
      if (mU > 0) { x.globalAlpha = mU; x.save(); x.translate(0, -w * 0.2 * (1 - mU)); Watch.dauphine(x, mins / 60 * TAU, r * 0.86, r * 0.042, 4); x.restore(); }
      if (sU > 0) { x.globalAlpha = sU; x.save(); x.translate(0, -w * 0.2 * (1 - sU)); Watch.secondsHand(x, now.getSeconds() / 60 * TAU); x.restore(); }
      x.restore(); x.globalAlpha = 1; }
    if (u4 > 0) { img(L.cry, u4, -w * 0.15, 1.1, 0); if (u4 < 1) { x.save(); x.beginPath(); x.arc(cx, cy, Watch.r * s * 1.02, 0, TAU); x.clip(); const gx = cx - w * 0.6 + u4 * w * 1.2, gg = x.createLinearGradient(gx - 40, 0, gx + 40, 0); gg.addColorStop(0, 'rgba(255,255,255,0)'); gg.addColorStop(0.5, 'rgba(255,255,255,.35)'); gg.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gg; x.fillRect(0, 0, w, w); x.restore(); } }
    if (u5 > 0 && u5 < 1) { for (let k = 0; k < 3; k++) { const rr = Watch.R * s * (1.02 + ((u5 + k / 3) % 1) * 0.25); x.beginPath(); x.arc(cx, cy, rr, 0, TAU); x.strokeStyle = `rgba(200,169,106,${0.5 * (1 - ((u5 + k / 3) % 1))})`; x.lineWidth = 1.5; x.stroke(); } }
    if (t >= 7.2) { x.globalAlpha = clamp((t - 7.2) / 0.2, 0, 1); x.drawImage(Watch.cv, cx - Watch.W * s / 2, cy - Watch.W * s / 2, Watch.W * s, Watch.W * s); x.globalAlpha = 1; }
  }
});
