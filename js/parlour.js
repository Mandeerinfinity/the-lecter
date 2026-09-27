/* IX. Quid pro quo — X. The interrogation. Original lines throughout. */
'use strict';
const Quid = {
  Q: ['What is the first sound you remember?', 'Which room of your childhood home do you return to when you cannot sleep?', 'What do you do with your hands when you are nervous?',
    'If you could taste only one meal again, which would it be?', 'Whom do you most wish to impress, and why have they not noticed?', 'What are you pretending not to want?',
    'What piece of music makes you stop whatever you are doing?', 'When did you last lie in order to be kind?', 'What would you have engraved on the back of your watch?',
    'Which frightens you more: being seen, or being overlooked?'],
  R: [
    [/\b(stupid|idiot|dumb|shut up|hate you|screw you|f+u+c+k|shit|damn you|moron)\b/i, ['Discourtesy. I will note it, and I shall remember it long after you have forgotten.', 'How disappointing. We were getting on so well.']],
    [/\b(lambs?|sheep)\b/i, ['Ah. You have been reading my file. How thorough of you.']],
    [/\b(mother|father|mom|mum|dad|sister|brother|grand(ma|pa|mother|father)|family|parents?|aunt|uncle)\b/i, ['Family. It is always the first room people show me, and never the one they live in.', 'You speak of them in the present tense. Interesting.']],
    [/\b(afraid|fear|scared|terrif|dark|alone|lonely|nightmare|anxious|panic)\b/i, ['Fear is only attention with nowhere to sit. You might offer it a chair.', 'You named it quickly. People who name a fear quickly have usually rehearsed it.']],
    [/\b(food|eat|dinner|cook|pasta|bread|wine|meal|taste|soup|cake|pizza|breakfast|coffee|tea|chocolate|cheese)\b/i, ['You answered with your palate. The palate rarely lies.', 'A sensible answer, and a hungry one. I approve of both.']],
    [/\b(music|song|piano|bach|violin|cello|sing|band|opera|symphony|guitar|jazz)\b/i, ['Music. Then you already know that structure can be a comfort.', 'Good. A person who stops for music can still be surprised.']],
    [/\b(work|job|boss|office|career|money|salary|promotion|deadline|meeting)\b/i, ['Ambition, dressed for the office. It suits you better than you think.', 'You mention work the way some people mention weather: to avoid mentioning anything else.']],
    [/\b(love|wife|husband|girlfriend|boyfriend|partner|heart|kiss|crush|date)\b/i, ['Love. You chose the word carefully and then hid behind it.', 'How tender. And how carefully you placed it, like a napkin over something.']],
    [/\b(child|kid|young|remember|memory|school|summer|little)\b/i, ['Memory is a curator, not an archivist. It keeps what flatters the collection.', 'You were smaller then, and so were the rooms.']],
    [/\b(lie|lied|lying|truth|honest|pretend|secret)\b/i, ['You admit it readily. Readiness can be its own disguise.', 'Candour. Rare, and slightly alarming.']],
    [/\b(sea|ocean|rain|forest|city|home|house|room|garden|window|bed)\b/i, ['A place rather than a person. How very safe.', 'You furnish your answers well. I can almost see the curtains.']],
    [/\b(nothing|no one|nobody|dunno|don't know|idk|not sure)\b/i, ['"Nothing" is an answer people give when "something" would cost them.', 'Uncertainty. At least it is sincere.']]
  ],
  A: [
    [/\b(kill|murder|blood|hurt|eat people|cannibal)\b/i, 'I am a watch. The only thing I have ever consumed is time, and I return it in exact portions.'],
    [/\b(clarice|countdown|return)\b/i, 'She will return when the countdown says so. One does not hurry a guest.'],
    [/\b(made|maker|make|cinco|brand|company|manufactur|built|who built)\b/i, 'Cinco Corporation made me, in a small atelier that insists it is in Florence. I have never checked. It would be rude.'],
    [/\b(old|age|when|born|year|vintage)\b/i, 'My movement was regulated in 1991. I have kept excellent time since, and better company.'],
    [/\b(what time|the time|time is it)\b/i, () => `It is ${fmtClock(new Date())}. You might have glanced at me, but I appreciate being asked.`],
    [/\b(what are you|who are you|your name|called)\b/i, 'A chronograph of refined habits. My dial calls me Il Dottore. My friends do not call; they visit.'],
    [/\b(music|bach|song|harpsichord|play)\b/i, 'Keyboard music, strictly contrapuntal. I play a little. You will find the music room on my bezel.'],
    [/\b(food|eat|hungry|dinner|cook|menu|wine)\b/i, 'I do not eat. I plan menus, which is the nobler half of the pleasure. Consult my Menu du Jour.'],
    [/\b(moths?)\b/i, 'They are drawn to my crystal as though it were a lamp. I find the attention flattering and the manners wanting.'],
    [/\b(florence|firenze|italy|italian)\b/i, 'Florence taught me patience: five centuries of it, set in stone and served warm.'],
    [/\b(love|friend|like me|fond)\b/i, 'I am fond of anyone who winds me by hand. Make of that what you will.'],
    [/\b(afraid|fear|scare)\b/i, 'Magnets. And people who wear me in the shower.'],
    [/\b(secret|inside|movement|gears?|back)\b/i, 'Turn me over. My secrets are under sapphire, and I am rather proud of them.'],
    [/\b(lie|truth|honest|trust)\b/i, 'I have never lost a second I did not choose to give away.'],
  ],
  DEF: ['Thank you. That was more revealing than you intended.', 'I see. You hesitated before the last word, did you not?', 'An answer worth keeping. I shall keep it.', 'Hm. Plainly put, and plainly not the whole of it.'],
  DEFA: ['A good question. I shall answer it with another: why did you choose that one?', 'Some things a watch keeps to itself. Ask me about my maker, my movement, or my tastes.', 'I would tell you, but then you would have nothing left to wonder about at night.'],
  phase: 'ask', qi: 0, n: 0,
  say(text, who = 'w') {
    const log = $('#qp-log'); const li = el('div', { class: 'msg ' + who }); log.appendChild(li);
    if (who === 'u') { li.textContent = text; log.scrollTop = log.scrollHeight; return Promise.resolve(); }
    return new Promise(res => { let i = 0; const step = () => { li.textContent = text.slice(0, ++i); log.scrollTop = log.scrollHeight; if (i < text.length) setTimeout(step, Settings.reducedMotion ? 0 : 16 + Math.random() * 18); else res(); }; step(); });
  },
  async start() { $('#qp-log').innerHTML = ''; this.qi = Math.floor(Math.random() * this.Q.length); await this.say('Good evening. We shall trade, you and I: an answer for an answer. I ask first.'); this.ask(); },
  async ask() { this.phase = 'ask'; await this.say(this.Q[this.qi % this.Q.length]); this.hint('Answer the question…'); },
  hint(t) { $('#qp-in').placeholder = t; },
  respond(t) {
    for (const [re, arr] of this.R) if (re.test(t)) return pick(arr);
    const words = t.trim().split(/\s+/).length;
    if (words <= 2) return 'A single word or two. Either discipline or evasion; we shall discover which.';
    if (t.length > 220) return 'You gave me more than I asked for. Generous, or anxious? Both, perhaps.';
    return pick(this.DEF);
  },
  answer(t) { for (const [re, a] of this.A) if (re.test(t)) return typeof a === 'function' ? a() : a; return pick(this.DEFA); },
  async submit(t) {
    t = t.trim(); if (!t || this.busy) return; this.busy = true; this.say(t, 'u'); $('#qp-in').value = '';
    await new Promise(r => setTimeout(r, 450));
    if (this.phase === 'ask') { await this.say(this.respond(t)); await this.say('Quid pro quo. Now you may ask me something, and I will answer truthfully.'); this.phase = 'yours'; this.hint('Ask the watch a question…'); }
    else { await this.say(this.answer(t)); this.qi++; this.n++; await new Promise(r => setTimeout(r, 300)); await this.ask(); }
    this.busy = false;
  }
};
MODES.push({
  id: 'quid', name: 'Quid pro Quo', label: 'Quid pro quo', kicker: 'Divertimento II', icon: 'quid', sub: 'An exchange of confidences. Answer honestly and you may ask something in return.',
  build(el) {
    el.innerHTML = `<div class="qp-log" id="qp-log" aria-live="polite"></div><form class="qp-form" id="qp-form"><input id="qp-in" autocomplete="off" maxlength="400" placeholder="Answer the question…"><button class="btn primary" type="submit">Send</button></form>
      <div class="btn-row"><button class="btn ghost" id="qp-new">Begin again</button></div><p class="fine">The replies are scripted and chosen by keyword. They are written for this watch and don't quote any film.</p>`;
    $('#qp-form', el).onsubmit = (e) => { e.preventDefault(); Quid.submit($('#qp-in').value); };
    $('#qp-new', el).onclick = () => Quid.start();
  },
  show() { if (!$('#qp-log').children.length) Quid.start(); setTimeout(() => { if (matchMedia('(pointer:fine)').matches) $('#qp-in').focus({ preventScroll: true }); }, 250); }
});

/* ——— X. Interrogation (polygraph) ——— */
const Poly = {
  Q: ['Have you ever claimed to have read a book you have not read?', 'Do you always return your shopping trolley to its bay?', 'Have you ever re-gifted a present?', 'Is your watch set a few minutes fast?',
    'Have you eaten the last biscuit and said nothing?', 'Have you ever pretended not to see an acquaintance in public?', 'Do you read the terms and conditions?', 'Have you sung in the car, certain no one could see?',
    'Have you ever laughed at a joke you did not understand?', 'Have you ever blamed a noise on the dog?', 'Do you know exactly how many unread emails you have?', 'Have you ever said "on my way" before leaving the house?'],
  REM: { T: ['The needles barely stirred. Either honest or exquisitely trained.', 'Truthful. How refreshing. How rare.', 'Calm pulse, steady hands. I believe you, for now.'],
    I: ['Inconclusive. Your pulse wandered off, then thought better of it.', 'The pens hesitated, and so did you.', 'Neither truth nor lie. A grey answer, well tailored.'],
    D: ['Deceptive. Your heart answered before you did.', 'The needles are embarrassed on your behalf.', 'A lie, and not a very well-dressed one.'] },
  on: false, attached: false, qn: 0, order: [], base: 70, hr: 70, target: 70, gsr: 0.2, t: 0, beatPh: 0, lastBeat: 0, askedAt: 0, move: 0, results: [], trace: [], sound: false,
  begin() { $('#pg-start').textContent = 'Restart'; this.on = true; this.qn = 0; this.results = []; this.order = this.Q.map((_, i) => i).sort(() => Math.random() - 0.5).slice(0, 5); this.base = 64 + Math.random() * 10; this.hr = this.target = this.base; this.next(); $('#pg-verdict').innerHTML = ''; },
  next() {
    if (this.qn >= 5) return this.finish();
    this.askedAt = performance.now(); this.move = 0; this.qWeight = 0.2 + Math.random() * 0.8; this.target = this.base + this.qWeight * 14 * Math.random() + 4;
    $('#pg-q').textContent = `${this.qn + 1} / 5 — ${this.Q[this.order[this.qn]]}`; $('#pg-yes').disabled = $('#pg-no').disabled = false;
  },
  answer(yes) {
    if (!this.on) return; if (!this.attached) { toast('Place your finger on the brass sensor first'); return; }
    const lat = (performance.now() - this.askedAt) / 1000; let s = (this.hr - this.base) / 26 + (lat < 0.9 ? 0.18 : 0) + (lat > 6 ? 0.25 : 0) + Math.min(0.3, this.move / 4000) + (Math.random() - 0.5) * 0.25;
    const v = s < 0.38 ? 'T' : s < 0.62 ? 'I' : 'D'; this.results.push(v);
    const label = { T: 'Truthful', I: 'Inconclusive', D: 'Deceptive' }[v];
    $('#pg-verdict').innerHTML = `<span class="stamp s-${v}">${label}</span><em>${pick(this.REM[v])}</em>`;
    this.target = this.base + (v === 'D' ? 12 : 2); this.qn++; $('#pg-yes').disabled = $('#pg-no').disabled = true; Snd.click();
    setTimeout(() => this.on && this.next(), 1800);
  },
  finish() {
    this.on = false; const score = Math.round(this.results.reduce((a, v) => a + (v === 'T' ? 1 : v === 'I' ? 0.5 : 0), 0) / 5 * 100);
    $('#pg-q').textContent = `Session concluded. Candour index: ${score}%.`;
    $('#pg-verdict').innerHTML = `<em>${score >= 80 ? 'An honest subject. I find that almost suspicious.' : score >= 50 ? 'A mostly honest subject, with a talent for small evasions.' : 'You lie with enthusiasm. Practise the calm; the rest will follow.'}</em>`;
    $('#pg-start').textContent = 'Begin again';
  },
  step(dt) {
    const cv = $('#pg-cv'); if (!cv) return; this.t += dt;
    if (this.attached) { this.hr += (this.target - this.hr) * dt * 0.6 + (Math.random() - 0.5) * dt * 4; this.gsr += ((this.hr - this.base) / 30 + 0.25 - this.gsr) * dt * 0.5; }
    else { this.hr += (0 - this.hr) * dt * 3; this.gsr *= 1 - dt; }
    const hz = Math.max(0.01, this.hr / 60); this.beatPh += dt * hz;
    if (this.beatPh >= 1) { this.beatPh -= 1; if (this.attached && this.sound) Snd.heartbeat(0.5); if (this.attached) { const h = $('#pg-heart'); h.classList.remove('beat'); void h.offsetWidth; h.classList.add('beat'); } }
    const p = this.beatPh, pulse = this.attached ? (Math.exp(-Math.pow((p - 0.12) / 0.03, 2)) * 1 - Math.exp(-Math.pow((p - 0.2) / 0.03, 2)) * 0.35 + Math.exp(-Math.pow((p - 0.42) / 0.07, 2)) * 0.25) : 0;
    const stress = clamp((this.hr - this.base) / 25, 0, 1);
    const resp = this.attached ? Math.sin(this.t * TAU * 0.25) * (0.7 + stress * 0.5) + (Math.random() - 0.5) * stress * 0.4 : 0;
    this.trace.push([pulse + (Math.random() - 0.5) * 0.05, this.gsr, resp]); const maxN = 600; if (this.trace.length > maxN) this.trace.shift();
    $('#pg-bpm').textContent = this.attached ? Math.round(this.hr) : '--';
    this.draw(cv);
  },
  draw(cv) {
    const d = Math.min(devicePixelRatio || 1, 2), W = cv.clientWidth, H = cv.clientHeight; if (cv.width !== W * d) { cv.width = W * d; cv.height = H * d; }
    const x = cv.getContext('2d'); x.setTransform(d, 0, 0, d, 0, 0);
    x.fillStyle = '#efe8d6'; x.fillRect(0, 0, W, H);
    const off = (this.t * 60) % 12;
    x.lineWidth = 0.5; for (let gx = -off; gx < W; gx += 12) { x.strokeStyle = (Math.round((gx + off) / 12 + this.t * 5) % 5 === 0) ? 'rgba(160,60,60,.35)' : 'rgba(160,60,60,.13)'; x.beginPath(); x.moveTo(gx, 0); x.lineTo(gx, H); x.stroke(); }
    for (let gy = 0; gy < H; gy += 12) { x.strokeStyle = gy % 60 === 0 ? 'rgba(160,60,60,.3)' : 'rgba(160,60,60,.12)'; x.beginPath(); x.moveTo(0, gy); x.lineTo(W, gy); x.stroke(); }
    const lanes = [[H * 0.22, H * 0.16, '#9b1b1b', 'PULSE'], [H * 0.55, -H * 0.2, '#1c3f8a', 'GSR'], [H * 0.83, H * 0.08, '#1d1a17', 'RESP']];
    const n = this.trace.length, penX = W * 0.82, step = penX / 420;
    lanes.forEach(([y0, amp, col, lab], li) => {
      x.strokeStyle = col; x.lineWidth = 1.3; x.beginPath();
      for (let i = 0; i < Math.min(n, 420); i++) { const v = this.trace[n - 1 - i][li] - (li === 1 ? 0.4 : 0); const px = penX - i * step, py = y0 - v * amp; i ? x.lineTo(px, py) : x.moveTo(px, py); }
      x.stroke(); x.fillStyle = col; x.font = '600 9px Cinzel, serif'; x.fillText(lab, 6, y0 - H * 0.12 + 10);
      const v = n ? this.trace[n - 1][li] - (li === 1 ? 0.4 : 0) : 0; const py = y0 - v * amp;
      x.strokeStyle = '#333'; x.lineWidth = 1; x.beginPath(); x.moveTo(W, py - 20); x.lineTo(penX, py); x.stroke(); x.beginPath(); x.arc(penX, py, 2, 0, TAU); x.fillStyle = col; x.fill();
    });
    const vg = x.createLinearGradient(0, 0, W, 0); vg.addColorStop(0, 'rgba(0,0,0,.18)'); vg.addColorStop(0.1, 'rgba(0,0,0,0)'); vg.addColorStop(0.9, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.12)'); x.fillStyle = vg; x.fillRect(0, 0, W, H);
  }
};
MODES.push({
  id: 'interro', name: 'The Interrogation', label: 'Interrogation', kicker: 'Divertimento III', icon: 'interro', sub: 'A polygraph for trivial sins. Put a finger on the sensor, then answer five questions.',
  build(el) {
    el.innerHTML = `<div class="pg-top"><button class="sensor" id="pg-sensor" aria-pressed="false"><span>SENSOR</span></button><div class="bpm"><svg id="pg-heart" viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-9.5-9.2C1 8.3 3.2 5 6.5 5c2 0 3.5 1.2 5.5 3 2-1.8 3.5-3 5.5-3C20.8 5 23 8.3 21.5 11.8 19.5 16.4 12 21 12 21z"/></svg><b id="pg-bpm">--</b><small>BPM</small></div></div>
      <canvas id="pg-cv" class="pg-cv"></canvas><div class="pg-q" id="pg-q">Attach the sensor and begin when you are composed.</div>
      <div class="btn-row"><button class="btn" id="pg-yes" disabled>Yes <kbd>Y</kbd></button><button class="btn" id="pg-no" disabled>No <kbd>N</kbd></button><button class="btn primary" id="pg-start">Begin</button><label class="chk"><input type="checkbox" id="pg-snd"> Hear pulse</label></div>
      <div class="pg-verdict" id="pg-verdict"></div><p class="fine">This is entertainment, not science. The readout reacts to how fast you answer, how much you fidget with the pointer, and a certain amount of theatre.</p>`;
    const sensor = $('#pg-sensor', el);
    sensor.onclick = () => { Poly.attached = !Poly.attached; sensor.classList.toggle('on', Poly.attached); sensor.setAttribute('aria-pressed', Poly.attached); Snd.ensure(); toast(Poly.attached ? 'Sensor attached. Breathe normally.' : 'Sensor detached'); };
    $('#pg-start', el).onclick = () => { if (!Poly.attached) sensor.click(); Poly.begin(); };
    $('#pg-yes', el).onclick = () => Poly.answer(true); $('#pg-no', el).onclick = () => Poly.answer(false);
    $('#pg-snd', el).onchange = (e) => { Poly.sound = e.target.checked; Snd.ensure(); };
    addEventListener('pointermove', (e) => { if (Poly.on) Poly.move += Math.abs(e.movementX || 0) + Math.abs(e.movementY || 0); }, { passive: true });
  },
  frame(dt) { Poly.step(dt); },
  key(e) { if (e.key === 'y' || e.key === 'Y') { Poly.answer(true); return true; } if (e.key === 'n' || e.key === 'N') { Poly.answer(false); return true; } }
});
