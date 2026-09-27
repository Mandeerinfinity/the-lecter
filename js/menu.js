/* VIII. Menu du Jour — an engraved dinner card composer (ordinary fine dining, nothing untoward). */
'use strict';
const MENU_DATA = {
  amuse: [
    ['Gougères of aged Comté', 'Champagne Blanc de Blancs'], ['Oyster, shallot mignonette, cucumber pearls', 'Muscadet Sèvre-et-Maine sur lie'],
    ['Chilled velouté of pea and mint', 'Franciacorta Satèn'], ['Parmesan tuile, black fig and aged balsamic', 'Prosecco Superiore, Valdobbiadene'],
    ['Beetroot tartlet with whipped chèvre', 'Crémant de Loire rosé'], ['Truffled quail egg on toasted brioche', 'Champagne, vintage Brut']
  ],
  entree: {
    spring: [['White asparagus, sauce mousseline, chervil', 'Grüner Veltliner Smaragd'], ['Salad of spring peas, pea shoots and pecorino', 'Vermentino di Gallura']],
    summer: [['Burrata, heirloom tomatoes, basil and aged balsamic', 'Rosé de Provence'], ['Carpaccio of sea bream, lemon, fennel pollen', 'Assyrtiko, Santorini']],
    autumn: [['Velouté of roasted chestnut, sage brown butter', 'Meursault'], ['Salad of pear, walnut and Gorgonzola dolce', 'Gewürztraminer, Alsace']],
    winter: [['Consommé of wild mushroom, chive and crème fraîche', 'Amontillado Sherry'], ['Bitter leaves, blood orange and hazelnut', 'Soave Classico']]
  },
  primo: [
    ['Tagliatelle with porcini and thyme', 'Rosso di Montalcino'], ['Risotto alla milanese, saffron and aged Parmigiano', 'Gavi di Gavi'],
    ['Ravioli of ricotta and lemon, brown butter, sage', 'Vernaccia di San Gimignano'], ['Pappardelle with wild boar ragù', 'Morellino di Scansano'],
    ['Tortelli di patate in the Mugello manner', 'Carmignano'], ['Gnocchi of pumpkin, amaretti and sage', 'Pinot Grigio, Collio']
  ],
  poisson: [
    ['Seared scallops, cauliflower purée, toasted hazelnut', 'Chablis Premier Cru'], ['Dover sole meunière, capers and parsley', 'Puligny-Montrachet'],
    ['Turbot, Champagne beurre blanc, a spoon of caviar', 'Champagne, Grand Cru'], ['Halibut in saffron broth with mussels', 'Pouilly-Fumé'],
    ['Loup de mer baked in salt, fennel and olive oil', 'Vermentino, Bolgheri']
  ],
  sorbet: [['Blood-orange sorbet with a breath of Campari', ''], ['Champagne and elderflower granité', ''], ['Lemon and basil sorbet', ''], ['Green apple and Calvados sorbet', '']],
  plat: [
    ['Beef tenderloin, sauce bordelaise, pommes Anna', 'Brunello di Montalcino'], ['Roast guinea fowl, morels and vin jaune', 'Chambolle-Musigny'],
    ['Venison loin, celeriac, juniper and blackberry', 'Barolo'], ['Duck breast, sour cherries and port', 'Amarone della Valpolicella'],
    ['Veal saltimbocca with sage and prosciutto', 'Bolgheri Rosso'], ['Bistecca alla fiorentina, rosemary potatoes', 'Super Tuscan, Bolgheri'],
    ['Wellington of wild mushrooms and chestnut', 'Pinot Noir, Côte de Nuits']
  ],
  formaggi: [['Pecorino Toscano, chestnut honey, walnuts', 'Vin Santo'], ['Comté, Époisses and Roquefort with quince paste', 'Tawny Port, twenty years'], ['Parmigiano Reggiano thirty-six months, aged balsamic', 'Lambrusco di Sorbara']],
  dolce: [
    ['Zabaglione with Marsala and fresh figs', 'Marsala Superiore'], ['Tarte Tatin with crème fraîche', 'Coteaux du Layon'], ['Chocolate fondant, blood orange', 'Banyuls'],
    ['Panna cotta, poached rhubarb', "Moscato d'Asti"], ['Crème brûlée with Tahitian vanilla', 'Sauternes'], ['Pear poached in red wine, mascarpone', 'Tokaji Aszú, five puttonyos']
  ],
  migna: ['Cantucci and a glass of Vin Santo', 'Salted caramels and pâtes de fruits', 'Candied orange peel in dark chocolate', 'Macarons of pistachio, rose and cassis', 'Florentines with candied cherry'],
  notes: [
    'Serve slowly. Conversation is the course that cannot be rushed.', 'Candles low, voices lower, and the good silver.', 'A dinner is a composition; the guests are its instruments.',
    'Decant the red an hour ahead, and do not apologise for the bread.', 'Seat the loudest guest beside the kindest one.', 'Linen napkins. There is no argument.'
  ],
  occasions: { intimate: 'An intimate dinner', party: 'A dinner party', gala: 'A gala in the grand manner', lunch: 'A Sunday luncheon' }
};
const MenuCard = {
  seed: Date.now() & 0xffffff, guests: 6, occasion: 'party', season: 'auto',
  compose() {
    const r = mulberry32(this.seed), D = MENU_DATA, now = new Date();
    const season = this.season !== 'auto' ? this.season : ['winter', 'winter', 'spring', 'spring', 'spring', 'summer', 'summer', 'summer', 'autumn', 'autumn', 'autumn', 'winter'][now.getMonth()];
    const course = (label, list) => { const [n, w] = pick(list, r); return { label, n, w }; };
    const c = [course('Amuse-bouche', D.amuse), course('Antipasto', D.entree[season]), course('Primo', D.primo), course('Pesce', D.poisson)];
    if (this.occasion !== 'lunch') c.push(course('Intermezzo', D.sorbet));
    c.push(course('Secondo', D.plat));
    if (this.occasion === 'gala' || this.occasion === 'party') c.push(course('Formaggi', D.formaggi));
    c.push(course('Dolce', D.dolce));
    if (this.occasion === 'intimate') c.splice(3, 1);
    return { courses: c, migna: pick(D.migna, r), note: pick(D.notes, r), season, date: now };
  },
  draw(cv, scale = 1) {
    const m = this.compose(), W = 520, lineH = 64, H = 250 + m.courses.length * lineH + 150;
    cv.width = W * scale * 2; cv.height = H * scale * 2; cv.style.aspectRatio = W + ' / ' + H;
    const x = cv.getContext('2d'); x.setTransform(scale * 2, 0, 0, scale * 2, 0, 0);
    // paper
    const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#f7f1e3'); g.addColorStop(1, '#e8dcc3'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    const rr = mulberry32(3); for (let i = 0; i < 5000; i++) { x.fillStyle = `rgba(${rr() < 0.5 ? '120,95,60' : '255,255,255'},${rr() * 0.07})`; x.fillRect(rr() * W, rr() * H, 1, 1); }
    const vg = x.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.8); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(90,60,20,.18)'); x.fillStyle = vg; x.fillRect(0, 0, W, H);
    const ink = '#2a2118', red = '#7c1c1c';
    // engraved double rule border + corner flourishes
    x.strokeStyle = ink; x.lineWidth = 1.6; x.strokeRect(18, 18, W - 36, H - 36); x.lineWidth = 0.6; x.strokeRect(25, 25, W - 50, H - 50);
    const corner = (cx, cy, sx, sy) => { x.save(); x.translate(cx, cy); x.scale(sx, sy); x.lineWidth = 0.9; x.beginPath(); x.moveTo(0, 26); x.bezierCurveTo(0, 8, 8, 0, 26, 0); x.moveTo(6, 30); x.bezierCurveTo(8, 14, 14, 8, 30, 6); x.stroke();
      x.beginPath(); x.arc(12, 12, 3, 0, TAU); x.fillStyle = red; x.fill(); x.beginPath(); x.moveTo(20, 20); x.quadraticCurveTo(34, 18, 40, 30); x.moveTo(20, 20); x.quadraticCurveTo(18, 34, 30, 40); x.stroke(); x.restore(); };
    corner(30, 30, 1, 1); corner(W - 30, 30, -1, 1); corner(30, H - 30, 1, -1); corner(W - 30, H - 30, -1, -1);
    x.textAlign = 'center'; x.textBaseline = 'alphabetic'; x.fillStyle = ink;
    x.font = '600 11px Cinzel, serif'; spacedText(x, 'CINCO CORPORATION · SALLE À MANGER', W / 2, 62, 3);
    x.font = '64px "Pinyon Script", cursive'; x.fillStyle = red; x.fillText('Menu du Jour', W / 2, 122);
    x.fillStyle = ink; x.font = 'italic 17px "Cormorant Garamond", serif';
    const dateFr = m.date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    x.fillText(dateFr.charAt(0).toUpperCase() + dateFr.slice(1), W / 2, 164);
    x.font = '500 14px "Cormorant Garamond", serif'; x.fillText(`${MENU_DATA.occasions[this.occasion]} for ${this.guests} · ${m.season.charAt(0).toUpperCase() + m.season.slice(1)}`, W / 2, 186);
    const orn = (y) => { x.strokeStyle = ink; x.lineWidth = 0.7; x.beginPath(); x.moveTo(W / 2 - 90, y); x.lineTo(W / 2 - 14, y); x.moveTo(W / 2 + 14, y); x.lineTo(W / 2 + 90, y); x.stroke(); x.save(); x.translate(W / 2, y); x.rotate(Math.PI / 4); x.fillStyle = red; x.fillRect(-4, -4, 8, 8); x.restore(); };
    orn(208);
    let y = 244;
    m.courses.forEach(c => {
      x.fillStyle = red; x.font = '600 10px Cinzel, serif'; spacedText(x, c.label.toUpperCase(), W / 2, y - 16, 3);
      x.fillStyle = ink; x.font = '600 19px "Cormorant Garamond", serif'; this.fit(x, c.n, W / 2, y + 6, W - 110);
      if (c.w) { x.font = 'italic 14px "Cormorant Garamond", serif'; x.fillStyle = '#5a4a38'; x.fillText(c.w, W / 2, y + 26); }
      y += lineH;
    });
    orn(y - 8);
    x.fillStyle = ink; x.font = 'italic 15px "Cormorant Garamond", serif'; x.fillText('Mignardises: ' + m.migna.charAt(0).toLowerCase() + m.migna.slice(1), W / 2, y + 22);
    x.font = 'italic 14px "Cormorant Garamond", serif'; x.fillStyle = '#5a4a38'; x.fillText('“' + m.note + '”', W / 2, y + 52);
    x.font = '26px "Pinyon Script", cursive'; x.fillStyle = ink; x.fillText('Il Dottore', W / 2, H - 50);
    x.font = '600 8px Cinzel, serif'; spacedText(x, 'CARD Nº ' + String(this.seed % 10000).padStart(4, '0'), W / 2, H - 34, 2);
    return m;
  },
  fit(x, t, cx, y, maxW) { let s = 19; while (x.measureText(t).width > maxW && s > 13) { s--; x.font = `600 ${s}px "Cormorant Garamond", serif`; } x.fillText(t, cx, y); }
};
MODES.push({
  id: 'menu', name: 'Menu du Jour', label: 'Menu', kicker: 'Divertimento I', icon: 'menu', sub: 'An engraved dinner card with a wine pairing for every course. Tasteful, seasonal and wholly ordinary ingredients.',
  build(el) {
    el.innerHTML = `<div class="menu-ctl"><label>Occasion<select id="mn-occ"><option value="intimate">Intimate dinner</option><option value="party" selected>Dinner party</option><option value="gala">Gala</option><option value="lunch">Sunday luncheon</option></select></label>
      <label>Season<select id="mn-sea"><option value="auto">By the calendar</option><option value="spring">Spring</option><option value="summer">Summer</option><option value="autumn">Autumn</option><option value="winter">Winter</option></select></label>
      <label>Guests<input type="number" id="mn-g" min="2" max="24" value="6"></label></div>
      <div class="btn-row"><button class="btn primary" id="mn-new">Compose a new menu</button><button class="btn" id="mn-save">Save card as PNG</button></div>
      <div class="card-wrap"><canvas id="menu-card"></canvas></div>`;
    const redraw = () => { MenuCard.occasion = $('#mn-occ').value; MenuCard.season = $('#mn-sea').value; MenuCard.guests = clamp(+$('#mn-g').value || 6, 2, 24); MenuCard.draw($('#menu-card')); };
    ['mn-occ', 'mn-sea', 'mn-g'].forEach(id => $('#' + id, el).onchange = redraw);
    $('#mn-new', el).onclick = () => { MenuCard.seed = (MenuCard.seed * 16807 + 11) % 2147483647; redraw(); Snd.ensure(); Snd.pluck(79, 0, 0.4, 0, Snd.sfx); Snd.pluck(84, Snd.ctx.currentTime + 0.08, 0.4, 0, Snd.sfx); };
    $('#mn-save', el).onclick = () => { const c = document.createElement('canvas'); MenuCard.draw(c, 1.5); downloadDataURL(c.toDataURL('image/png'), 'menu-du-jour.png'); toast('Menu card saved'); };
    this.redraw = redraw;
  },
  show() { this.redraw(); }
});
