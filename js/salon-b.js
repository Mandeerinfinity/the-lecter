/* Ring II · Salone — V. Sessions with the Doctor · VI. Session notes · VII. Wine cellar */
'use strict';
const esc = (t) => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ——— V. Sessions with the Doctor (focus timer) ——— */
const Sessions = {
  s: Store.get('sess', { phase: 'idle', idx: 1, end: 0, left: 0, running: false }),
  cfg: Object.assign({ focus: 25, short: 5, long: 15, cycles: 4, dim: true }, Store.get('sessCfg', {})),
  log: Store.get('sessLog', {}),
  LINES: {
    start: ['Sit. Begin whenever you are ready. The first minute is always the hardest, and the least interesting.', 'Good. Leave everything else outside the door. It will wait for you; most things do.', 'Attend to one thing. Just the one. The rest of the world can manage without your supervision for a while.'],
    focusEnd: ['Time. Stand up, stretch, and look at something far away. Your eyes have been very patient with you.', 'That was good work. Rest now. Even a fine instrument is put down between performances.', 'Enough for now. Have some water. We shall continue shortly.'],
    restEnd: ['Back to the chair, please. Where were we?', 'The interval is over. Let us resume, and do keep your mind from wandering to the window.', 'Rested? Good. Once more, with attention.'],
    long: ['That is a full set. Take a proper break: walk, eat something well prepared, and leave your messages unread for a while.'],
    pause: ['Paused. I shall keep your place.']
  },
  save() { Store.set('sess', this.s); },
  dur(ph = this.s.phase) { return (ph === 'focus' ? this.cfg.focus : ph === 'short' ? this.cfg.short : ph === 'long' ? this.cfg.long : this.cfg.focus) * 60000; },
  remaining() { return this.s.running ? Math.max(0, this.s.end - Date.now()) : (this.s.left || this.dur()); },
  frac() { return this.s.phase === 'idle' ? 0 : 1 - this.remaining() / this.dur(); },
  today() { const k = new Date().toDateString(); return this.log[k] || { n: 0, mins: 0 }; },
  remark(kind) { const l = pick(this.LINES[kind]); this.last = l; Bus.emit('sess:remark', l); Voice.speak(l); return l; },
  start() { Snd.ensure(); if (this.s.phase === 'idle') { this.s = { phase: 'focus', idx: 1, end: 0, left: 0, running: false }; this.remark('start'); } else if (!this.s.left) this.remark('start');
    this.s.end = Date.now() + (this.s.left || this.dur()); this.s.left = 0; this.s.running = true; this.save(); this.cue('start'); Bus.emit('sess'); },
  pause() { if (!this.s.running) return; this.s.left = Math.max(1000, this.s.end - Date.now()); this.s.running = false; this.save(); this.remark('pause'); Bus.emit('sess'); },
  toggle() { this.s.running ? this.pause() : this.start(); },
  reset() { this.s = { phase: 'idle', idx: 1, end: 0, left: 0, running: false }; this.save(); this.last = null; Bus.emit('sess'); },
  skip() { if (this.s.phase === 'idle') return; this.advance(false); },
  advance(done) {
    const s = this.s;
    if (s.phase === 'focus') {
      if (done) { const k = new Date().toDateString(), t = this.log[k] || { n: 0, mins: 0 }; t.n++; t.mins += this.cfg.focus; this.log[k] = t; Store.set('sessLog', this.log); Bus.emit('ach', 'session'); }
      const long = s.idx % this.cfg.cycles === 0; s.phase = long ? 'long' : 'short'; this.remark(long ? 'long' : 'focusEnd');
    } else { const wasLong = s.phase === 'long'; s.phase = 'focus'; s.idx = wasLong ? 1 : s.idx + 1; this.remark('restEnd'); }
    s.end = Date.now() + this.dur(); s.left = 0; s.running = true; this.save(); this.cue(s.phase); Bus.emit('sess');
  },
  cue(kind) { if (!Snd.ctx) return; const t = Snd.ctx.currentTime + 0.05; if (kind === 'focus' || kind === 'start') [62, 66, 69, 74].forEach((m, i) => Snd.pluck(m, t + i * 0.1, 0.5, 0, Snd.sfx)); else { [74, 69, 66, 62].forEach((m, i) => Snd.pluck(m, t + i * 0.12, 0.5, 0, Snd.sfx)); Snd.bell(587.3, t + 0.6, 0.2, 2.5); } },
  check() { if (this.s.running && Date.now() >= this.s.end) this.advance(true); document.body.classList.toggle('focus-dim', !!(this.cfg.dim && this.s.running && this.s.phase === 'focus')); }
};
MODES.push({
  id: 'sessions', page: 2, name: 'Sedute', label: 'Sessions', kicker: 'Salone V', icon: 'sessions', sub: 'Sessions with the Doctor: focused intervals with measured rests, and a remark or two between them.',
  build(el) {
    const opt = (arr, v) => arr.map(n => `<option value="${n}" ${n === v ? 'selected' : ''}>${n} min</option>`).join('');
    el.innerHTML = `<div class="cd-ring se-ring"><svg viewBox="0 0 200 200" aria-hidden="true"><circle class="trk" cx="100" cy="100" r="88"/><circle class="val" id="se-val" cx="100" cy="100" r="88"/></svg>
        <div class="cd-read"><small id="se-phase">Not in session</small><b id="se-time">25:00</b><em id="se-idx"></em></div></div>
      <div class="se-dots" id="se-dots" aria-hidden="true"></div>
      <div class="btn-row center"><button class="btn primary" id="se-go">Begin session</button><button class="btn" id="se-skip">Skip</button><button class="btn ghost" id="se-reset">End</button></div>
      <blockquote class="doctor" id="se-quote">“Whenever you are ready.”<cite>the Doctor</cite></blockquote>
      <div class="menu-ctl se-ctl"><label>Focus<select id="se-f">${opt([15, 20, 25, 30, 45, 50], this.c().focus)}</select></label><label>Short rest<select id="se-s">${opt([3, 5, 10], this.c().short)}</select></label><label>Long rest<select id="se-l">${opt([15, 20, 30], this.c().long)}</select></label></div>
      <div class="btn-row"><label class="chk"><input type="checkbox" id="se-dim"> Dim the room during focus</label><label class="chk"><input type="checkbox" id="se-voice"> Let the Doctor speak aloud</label></div>
      <div class="grid2" style="margin-top:12px"><div class="stat"><label>Today</label><b id="se-n">0 sessions</b><small id="se-m">0 minutes of attention</small></div><div class="stat"><label>This week</label><b id="se-w">0 sessions</b><small>since Monday</small></div></div>`;
    $('#se-go', el).onclick = () => Sessions.toggle(); $('#se-skip', el).onclick = () => Sessions.skip(); $('#se-reset', el).onclick = () => Sessions.reset();
    [['#se-f', 'focus'], ['#se-s', 'short'], ['#se-l', 'long']].forEach(([s, k]) => $(s, el).onchange = (e) => { Sessions.cfg[k] = +e.target.value; Store.set('sessCfg', Sessions.cfg); this.ui(); });
    $('#se-dim', el).checked = Sessions.cfg.dim; $('#se-dim', el).onchange = (e) => { Sessions.cfg.dim = e.target.checked; Store.set('sessCfg', Sessions.cfg); };
    $('#se-voice', el).checked = Settings.voice; $('#se-voice', el).onchange = (e) => { setSetting('voice', e.target.checked); if (e.target.checked) Voice.speak('Very well. I shall speak up.', true); };
    Bus.on('setting:voice', v => { const c = $('#se-voice'); if (c) c.checked = v; });
    Bus.on('sess', () => this.ui()); Bus.on('sess:remark', (l) => { const q = $('#se-quote'); if (q) { q.innerHTML = `“${esc(l)}”<cite>the Doctor</cite>`; q.classList.remove('in'); void q.offsetWidth; q.classList.add('in'); } });
    this.ui();
  },
  c() { return Sessions.cfg; },
  ui() {
    if (!$('#se-go')) return; const s = Sessions.s;
    $('#se-go').textContent = s.running ? 'Pause' : s.phase === 'idle' ? 'Begin session' : 'Resume';
    $('#se-phase').textContent = s.phase === 'idle' ? 'Not in session' : s.phase === 'focus' ? 'Focus' : s.phase === 'short' ? 'Short rest' : 'Long rest';
    $('#se-idx').textContent = s.phase === 'idle' ? `${Sessions.cfg.cycles} sessions to a set` : `session ${s.idx} of ${Sessions.cfg.cycles}`;
    $('#se-dots').innerHTML = Array.from({ length: Sessions.cfg.cycles }, (_, i) => `<i class="${i + 1 < s.idx || (i + 1 === s.idx && s.phase !== 'focus' && s.phase !== 'idle') ? 'done' : i + 1 === s.idx && s.phase === 'focus' ? 'cur' : ''}"></i>`).join('');
    const t = Sessions.today(); $('#se-n').textContent = t.n + (t.n === 1 ? ' session' : ' sessions'); $('#se-m').textContent = t.mins + ' minutes of attention';
    const mon = new Date(); mon.setHours(0, 0, 0, 0); mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7)); let w = 0; Object.entries(Sessions.log).forEach(([k, v]) => { if (new Date(k) >= mon) w += v.n; }); $('#se-w').textContent = w + (w === 1 ? ' session' : ' sessions');
    this.tick();
  },
  tick() { const b = $('#se-time'); if (!b) return; const r = Sessions.remaining(); b.textContent = fmtDur(r, false); $('#se-val').style.strokeDashoffset = 553 * (1 - Sessions.frac()); },
  key(e) { if (e.code === 'Space') { Sessions.toggle(); return true; } }
});

/* ——— VI. Session notes (private journal) ——— */
const Notes = {
  list: Store.get('notes', []),
  save() { Store.set('notes', this.list); if (this.list.length >= 3) Bus.emit('ach', 'notes'); },
  add(title, body) { const n = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), t: Date.now(), u: Date.now(), title: title.trim(), body: body.trim() }; this.list.unshift(n); this.save(); return n; },
  update(id, title, body) { const n = this.list.find(x => x.id === id); if (n) { n.title = title.trim(); n.body = body.trim(); n.u = Date.now(); this.save(); } },
  del(id) { this.list = this.list.filter(x => x.id !== id); this.save(); },
  when(t) { return new Date(t).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: !Settings.h24 }); },
  text() { return 'CINCO CORPORATION · SESSION NOTES\n\n' + this.list.map(n => `${this.when(n.t)}${n.u - n.t > 60000 ? ' (edited ' + this.when(n.u) + ')' : ''}\n${n.title || 'Untitled'}\n\n${n.body}\n\n———\n`).join('\n'); },
  print() {
    let root = $('#print-root'); if (!root) { root = el('div', { id: 'print-root' }); document.body.appendChild(root); }
    root.innerHTML = `<header><div class="pr-stars">✦ ✦ ✦ ✦ ✦</div><h1>CINCO CORPORATION</h1><p>Session Notes · printed ${esc(this.when(Date.now()))}</p></header>` + (this.list.length ? this.list.map(n => `<article><h2>${esc(n.title || 'Untitled')}</h2><time>${esc(this.when(n.t))}</time><p>${esc(n.body).replace(/\n/g, '<br>')}</p></article>`).join('') : '<p><em>No notes yet.</em></p>') + '<footer>Private notes kept in a Cinco Corporation “Il Dottore” C-1991.</footer>';
    document.body.classList.add('printing'); const done = () => { document.body.classList.remove('printing'); removeEventListener('afterprint', done); }; addEventListener('afterprint', done); setTimeout(() => { try { window.print(); } catch (e) {} setTimeout(done, 1500); }, 60);
  }
};
MODES.push({
  id: 'notes', page: 2, name: 'Appunti', label: 'Notes', kicker: 'Salone VI', icon: 'notes', sub: 'Session notes: private, time-stamped, and stored only in this browser.',
  build(el) {
    el.innerHTML = `<form class="nt-form" id="nt-form"><input type="text" id="nt-title" maxlength="90" placeholder="Title (optional)" aria-label="Note title"><textarea id="nt-body" rows="5" maxlength="6000" placeholder="What did you notice today?" aria-label="Note"></textarea>
        <div class="btn-row"><button class="btn primary" type="submit" id="nt-save">Save note</button><button class="btn ghost" type="button" id="nt-cancel" hidden>Cancel editing</button><span class="nt-count" id="nt-count"></span></div></form>
      <div class="rule"></div>
      <div class="nt-tools"><input type="text" id="nt-q" placeholder="Search notes…" aria-label="Search notes"><button class="btn" id="nt-print">Print</button><button class="btn" id="nt-export">Export .txt</button></div>
      <ul class="nt-list" id="nt-list" aria-live="polite"></ul>`;
    this.editing = null;
    $('#nt-form', el).onsubmit = (e) => { e.preventDefault(); const t = $('#nt-title').value, b = $('#nt-body').value; if (!b.trim() && !t.trim()) return toast('An empty page says very little'); if (this.editing) { Notes.update(this.editing, t, b); toast('Note revised'); } else { Notes.add(t, b); toast('Noted. Filed under today.'); } this.clear(); this.render(); Snd.click(); };
    $('#nt-cancel', el).onclick = () => this.clear();
    $('#nt-body', el).oninput = () => $('#nt-count').textContent = $('#nt-body').value.length ? $('#nt-body').value.trim().split(/\s+/).length + ' words' : '';
    $('#nt-q', el).oninput = () => this.render();
    $('#nt-print', el).onclick = () => Notes.print();
    $('#nt-export', el).onclick = () => { const url = URL.createObjectURL(new Blob([Notes.text()], { type: 'text/plain' })); downloadDataURL(url, 'session-notes.txt'); setTimeout(() => URL.revokeObjectURL(url), 2000); toast('Notes exported'); };
    this.render();
  },
  clear() { this.editing = null; $('#nt-title').value = ''; $('#nt-body').value = ''; $('#nt-save').textContent = 'Save note'; $('#nt-cancel').hidden = true; $('#nt-count').textContent = ''; },
  render() {
    const q = ($('#nt-q').value || '').toLowerCase(), L = Notes.list.filter(n => !q || (n.title + ' ' + n.body).toLowerCase().includes(q));
    $('#nt-list').innerHTML = L.length ? L.map(n => `<li data-id="${n.id}"><div class="nt-h"><b>${esc(n.title || 'Untitled')}</b><time>${esc(Notes.when(n.t))}${n.u - n.t > 60000 ? ' · edited' : ''}</time></div><p>${esc(n.body).replace(/\n/g, '<br>')}</p>
      <div class="nt-act"><button class="chip" data-a="edit">Edit</button><button class="chip" data-a="del">Delete</button></div></li>`).join('') : `<li class="empty">${Notes.list.length ? 'Nothing matches that search.' : 'No notes yet. The first page is always the hardest.'}</li>`;
    $$('#nt-list li[data-id]').forEach(li => { const id = li.dataset.id;
      $('[data-a=edit]', li).onclick = () => { const n = Notes.list.find(x => x.id === id); this.editing = id; $('#nt-title').value = n.title; $('#nt-body').value = n.body; $('#nt-save').textContent = 'Save changes'; $('#nt-cancel').hidden = false; $('#nt-body').focus(); };
      $('[data-a=del]', li).onclick = (e) => { const b = e.currentTarget; if (b.dataset.sure) { Notes.del(id); this.render(); toast('Note destroyed. Discreetly.'); } else { b.dataset.sure = 1; b.textContent = 'Really delete?'; b.classList.add('warn'); setTimeout(() => { if (b.isConnected) { delete b.dataset.sure; b.textContent = 'Delete'; b.classList.remove('warn'); } }, 3000); } };
    });
  }
});

/* ——— VII. Wine cellar ——— */
const PAIR = {
  'Beef & lamb': [['Brunello di Montalcino', 'Tuscany', 'Sangiovese Grosso: black cherry, leather and firm tannin to meet a roast.', '17 °C', 'Bordeaux glass'], ['Pauillac', 'Bordeaux', 'Cabernet-led, cassis and cedar. Made for lamb.', '17 °C', 'Bordeaux glass'], ['Barolo', 'Piedmont', 'Tar and roses; it wants braised beef and patience.', '17 °C', 'Burgundy balloon'], ['Ribera del Duero', 'Castilla y León', 'Tempranillo with dark plum and toasted oak.', '16 °C', 'Bordeaux glass']],
  'Poultry & duck': [['Volnay', 'Burgundy', 'Silky Pinot Noir with red fruit. Lovely with roast chicken or duck.', '15 °C', 'Burgundy balloon'], ['Meursault', 'Burgundy', 'Rich Chardonnay: hazelnut, butter, a long finish.', '12 °C', 'White Burgundy glass'], ['Vino Nobile di Montepulciano', 'Tuscany', 'Supple, with violets and sour cherry.', '16 °C', 'Bordeaux glass']],
  'Fish': [['Chablis Premier Cru', 'Burgundy', 'Flinty, saline Chardonnay for sole or turbot.', '10 °C', 'White wine glass'], ['Sancerre', 'Loire', 'Sauvignon Blanc: citrus, gooseberry and chalk.', '9 °C', 'White wine glass'], ['Vermentino di Gallura', 'Sardinia', 'Herbal and bright, with a sea breeze.', '9 °C', 'White wine glass']],
  'Shellfish': [['Champagne Blanc de Blancs', 'Champagne', 'A fine bead and brioche. Oysters were invented for it.', '8 °C', 'Tulip'], ['Muscadet Sèvre et Maine sur lie', 'Loire', 'Lean, saline, a little yeasty.', '8 °C', 'White wine glass'], ['Albariño', 'Rías Baixas', 'Peach and sea spray, for prawns and scallops.', '9 °C', 'White wine glass']],
  'Pasta & risotto': [['Gavi di Gavi', 'Piedmont', 'Crisp Cortese with almond. For a risotto alla milanese.', '10 °C', 'White wine glass'], ['Rosso di Montalcino', 'Tuscany', 'The Brunello’s younger sibling: bright and forgiving.', '16 °C', 'Bordeaux glass'], ['Soave Classico', 'Veneto', 'Garganega: pear, chamomile, a savoury edge.', '10 °C', 'White wine glass']],
  'Mushrooms & truffle': [['Barbaresco', 'Piedmont', 'Nebbiolo with earth and roses, for anything from the forest floor.', '17 °C', 'Burgundy balloon'], ['Gevrey-Chambertin', 'Burgundy', 'Structured Pinot with a note of undergrowth.', '16 °C', 'Burgundy balloon']],
  'Cheese': [['Vintage Port', 'Douro', 'With Stilton, the classic. Decant it.', '18 °C', 'Port glass'], ['Sauternes', 'Bordeaux', 'Honeyed and bright. Sublime with Roquefort.', '10 °C', 'Dessert glass'], ['Vin Jaune', 'Jura', 'Nutty and oxidative, with aged Comté.', '14 °C', 'Clavelin tasting glass']],
  'Dessert': [['Tokaji Aszú 5 Puttonyos', 'Tokaj, Hungary', 'Apricot and marmalade with bright acidity.', '10 °C', 'Dessert glass'], ['Moscato d’Asti', 'Piedmont', 'Lightly sparkling and low in alcohol: white peach.', '7 °C', 'Tulip'], ['Vin Santo', 'Tuscany', 'Dried fig and caramel. Dip the cantucci; no one will tell.', '12 °C', 'Small tulip']],
  'Spiced dishes': [['Riesling Kabinett', 'Mosel', 'Off-dry, low alcohol, electric acidity.', '8 °C', 'Riesling glass'], ['Gewürztraminer', 'Alsace', 'Lychee and rose petals.', '10 °C', 'White wine glass']]
};
const Cellar = {
  list: Store.get('cellar', []),
  save() { Store.set('cellar', this.list); if (this.list.length >= 3) Bus.emit('ach', 'cellar'); },
  status(b) { const y = new Date().getFullYear(); if (b.from && y < b.from) return ['young', 'Lay it down']; if (b.to && y > b.to) return ['past', 'Drink soon']; if (b.from || b.to) return ['ready', 'Ready']; return ['', '']; }
};
MODES.push({
  id: 'cellar', page: 2, name: 'Cantina', label: 'Cellar', kicker: 'Salone VII', icon: 'cellar', sub: 'A sommelier on the wrist, and a cellar book that stays in this browser.',
  build(el) {
    el.innerHTML = `<div class="menu-ctl ce-ctl"><label>Tonight’s dish<select id="ce-dish">${Object.keys(PAIR).map(k => `<option>${k}</option>`).join('')}</select></label><label>&nbsp;<button class="btn primary" id="ce-go" type="button">Suggest a wine</button></label><label>&nbsp;<button class="btn" id="ce-rand" type="button">Surprise me</button></label></div>
      <div class="ce-card" id="ce-card" aria-live="polite"></div>
      <div class="rule"></div>
      <div class="kicker">Cellar book</div>
      <form class="ce-form" id="ce-form"><input type="text" id="ce-name" placeholder="Wine" required aria-label="Wine name"><input type="number" id="ce-vint" placeholder="Vintage" min="1900" max="2100" aria-label="Vintage"><input type="text" id="ce-reg" placeholder="Region" aria-label="Region">
        <input type="number" id="ce-qty" value="1" min="1" max="999" aria-label="Bottles"><input type="number" id="ce-from" placeholder="Drink from" min="1900" max="2150" aria-label="Drink from year"><input type="number" id="ce-to" placeholder="Drink by" min="1900" max="2150" aria-label="Drink by year"><button class="btn" type="submit">Add to the cellar</button></form>
      <div class="ce-sum" id="ce-sum"></div><ul class="ce-list" id="ce-list"></ul>`;
    $('#ce-go', el).onclick = () => this.suggest($('#ce-dish').value); $('#ce-rand', el).onclick = () => { const k = pick(Object.keys(PAIR)); $('#ce-dish').value = k; this.suggest(k); };
    $('#ce-form', el).onsubmit = (e) => { e.preventDefault(); const b = { id: Date.now().toString(36), name: $('#ce-name').value.trim(), vint: +$('#ce-vint').value || null, reg: $('#ce-reg').value.trim(), qty: Math.max(1, +$('#ce-qty').value || 1), from: +$('#ce-from').value || null, to: +$('#ce-to').value || null };
      if (!b.name) return; Cellar.list.unshift(b); Cellar.save(); e.target.reset(); $('#ce-qty').value = 1; this.render(); toast('Laid down in the cellar'); Snd.click(); };
    this.suggest(Object.keys(PAIR)[0]); this.render();
  },
  suggest(dish) {
    const w = pick(PAIR[dish]); this.cur = w;
    $('#ce-card').innerHTML = `<div class="label-card"><small>For ${esc(dish.toLowerCase())}</small><h3>${esc(w[0])}</h3><em>${esc(w[1])}</em><p>${esc(w[2])}</p><div class="lc-meta"><span>Serve at ${esc(w[3])}</span><span>${esc(w[4])}</span></div><button class="chip" id="ce-add">Add to cellar book</button></div>`;
    $('#ce-add').onclick = () => { $('#ce-name').value = w[0]; $('#ce-reg').value = w[1]; $('#ce-vint').focus(); toast('Add the vintage, then press “Add to the cellar”'); };
    const c = $('#ce-card .label-card'); c.classList.remove('in'); void c.offsetWidth; c.classList.add('in');
  },
  render() {
    const L = Cellar.list, tot = L.reduce((s, b) => s + b.qty, 0), ready = L.filter(b => Cellar.status(b)[0] === 'ready').reduce((s, b) => s + b.qty, 0);
    $('#ce-sum').innerHTML = L.length ? `<b>${tot}</b> bottle${tot === 1 ? '' : 's'} across <b>${L.length}</b> wine${L.length === 1 ? '' : 's'}${ready ? ` · <b>${ready}</b> ready to drink` : ''}` : '';
    $('#ce-list').innerHTML = L.length ? L.map(b => { const [cls, lab] = Cellar.status(b); return `<li data-id="${b.id}"><div><b>${esc(b.name)}${b.vint ? ' ' + b.vint : ''}</b><small>${esc(b.reg || '')}${b.from || b.to ? ` · drink ${b.from || '…'}–${b.to || '…'}` : ''}</small></div>${lab ? `<span class="ce-st ${cls}">${lab}</span>` : ''}
      <div class="ce-q"><button class="x" data-a="-" aria-label="Drink one">−</button><b>${b.qty}</b><button class="x" data-a="+" aria-label="Add one">+</button></div></li>`; }).join('') : '<li class="empty">The cellar is empty. A tragedy easily remedied.</li>';
    $$('#ce-list li[data-id]').forEach(li => { const b = Cellar.list.find(x => x.id === li.dataset.id);
      $('[data-a="+"]', li).onclick = () => { b.qty++; Cellar.save(); this.render(); };
      $('[data-a="-"]', li).onclick = () => { b.qty--; if (b.qty <= 0) { Cellar.list = Cellar.list.filter(x => x !== b); toast('The last bottle. I hope the company deserved it.'); } else toast('One bottle opened. Let it breathe.'); Cellar.save(); this.render(); };
    });
  }
});
