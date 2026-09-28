# Cinco Corporation presents: The Lecter
### “Il Dottore” · Calibre C-1991 · Automatic Chronograph

A luxury-watch web app, rendered entirely in code: Canvas 2D, Web Audio, HTML and CSS.
It has no build step, loads nothing from a CDN and makes no network requests. The fonts are bundled.
**Version 2 (“Il Salone”)** adds a second ring of thirteen salon complications, richer rendering, a cinematic intro, achievements and secrets,
and it installs as an offline app (PWA).
**Version 3 (“La Galleria”)** is tuned for phones (tested against an iPhone 15 Pro Max profile), adds an adaptive quality governor,
a new procedural audio engine, candlelit visuals and a third ring of twelve Galleria pieces.

## Run
```bash
cd lecter-watch
python3 -m http.server 8000     # then open http://localhost:8000
```
Opening `index.html` straight from disk also works, but the offline app needs http(s). Add `?noboot` to skip the introduction and `?nosw` to skip the service worker.
Live: https://mandeerinfinity.github.io/the-lecter/

## Install it (PWA)
On Chrome or Edge, use **Install** in the address bar or the **Install The Lecter** button in *Vetrina* (shown when the browser offers it). On iPhone, use Safari › Share › **Add to Home Screen**.
A service worker (`sw.js`) caches every file, so the watch opens and runs with no connection. It uses relative paths, so it works at a site root or under `/the-lecter/`.

## What's new in v3
### Performance (iPhone 15 Pro Max: 430×932 CSS px, DPR 3, ProMotion)
* **Settings › Performance: Auto / Smooth / Beautiful.** *Auto* measures real frame pacing (it detects 60, 90 or 120 Hz) and steps between three tiers
  (Smooth → Balanced → Beautiful) every 1.5 s, with hysteresis so it doesn't oscillate. *Smooth* favours frame rate; *Beautiful* renders at full DPR.
* **FPS meter**: Settings › *Show the frame-rate meter*, or add `?fps` to the URL. It shows fps, refresh rate, p95 frame time, JS time per frame, tier and canvas scale.
* Canvas backing stores are capped (1.5× Smooth, 2× Balanced, full DPR only in Beautiful) and sized to their visible box.
* The dial is drawn from cached layers: case, bezel, dial, sub-dials, lume and crystal are rendered once into off-screen canvases (small LRU keyed by light angle),
  and each frame only blits them and draws the hands. A frame is skipped entirely when nothing visible changed.
* Movement, tourbillon and moths use pre-rendered sprites with pre-blurred shadow sprites (no per-frame `shadowBlur`); moths clear only their own dirty rectangles.
* No per-frame DOM writes; the loop is `requestAnimationFrame` time-based, so motion speed is the same at 60 or 120 Hz.
* Expensive CSS removed: large `backdrop-filter`s, animated `filter: blur`, full-page `mix-blend-mode`, the per-frame night-vision grain (now one static noise tile moved by a
  composited transform), and filter-based dimming (now an opacity overlay). Animations use transform and opacity only.
* Hidden tabs, off-screen stages and idle complications do no drawing.
* Measured with Playwright (iPhone 15 Pro Max emulation, headless, same script, v2 vs v3 back-to-back; headless WebKit is capped near 60 Hz):

  | Mode | WebKit v2 → v3 (fps) | Chromium 4× CPU throttle v2 → v3 (fps) |
  |---|---|---|
  | Time (main dial) | 31 → 61 | 5.7 → 60 |
  | Tourbillon close-up | 20 → 44 | 3.8 → 43 |
  | Case back | 29 → 57 | 17.7 → 60 |
  | Moth storm | 18 → 47 | 5.2 → 60 |
  | Night vision | 12 → 48 | 5.5 → 60 |

### Sound
* Master chain: glue compressor → limiter. Convolution reverb from a generated **stone-room impulse response** (pre-delay, early reflections, a tail that darkens with time).
* **Harpsichord** v3: the Karplus–Strong strings now pass through soundboard/body resonance modes, with a quill transient and a jack/damper click on release.
* Modal-synthesis mechanical sounds, rendered once: escapement **tick/tock** pairs, **crown ratchet**, chronograph **pusher** down/up, **bezel detents**, a **case-flip whoosh**,
  UI **hover** and **select** sounds. **Repeater gongs** now have inharmonic partials in beating pairs.
* iOS-safe: the AudioContext is unlocked on the first touch with a silent buffer and resumed after backgrounding, `pageshow` or an interruption.
* **Haptics**: `navigator.vibrate` where it exists; on iPhone (Safari 18+) a light tap through the system switch control. Settings › *Haptic feedback*.

### Visuals
* Candlelight: a warm pool of light and a glint on the crystal that flicker (compositor-driven CSS animation; switched off in the Smooth tier). Settings › *Candlelight flicker*.
* Tilt parallax: the backdrop, candle, contact shadow and moths sit at different depths and shift against the tilt. Settings › *Parallax depth on tilt*.
  On iPhone, Settings › *Enable tilt* asks for motion permission.
* Stronger specular highlights and a faceted glint on the dauphine hands, a hot-spot reflection on the crystal, lapis sheen, 20-frame moth wingbeats with lagging hindwings.
* **Dark after sunset**: Settings › *Dark after sunset, light after sunrise* switches to Bone Ivory by day and back to your dark dial at night, using the location set in *Sole*.
* **Compact view**: `?view=compact` (or Settings › *Compact view*) shows only the watch. `Esc` or the × returns.

## Ring III · Galleria (12 positions; press `V` to cycle rings, `Shift+V` backwards)
| # | Piece | What it does and how to use it |
|---|---|---|
| 1 | **Calendario Perpetuo** | A perpetual calendar dial: day, date, month, four-year leap indicator, moon phase and a year window. Browse months with ‹ ›, tap a day, and the hands sweep to it. Explains 2100. |
| 2 | **Secondo Fuso (GMT)** | Pick a second time zone. A 24-hour disc shades day and night from the real solar altitude. Switch on *Show the red GMT hand* to fit a GMT hand and a 24-hour track to the main dial. |
| 3 | **Riserva & Cronometria** | Power-reserve gauge (0–42 h, linked to the case-back mainspring), rate in s/day, amplitude and beat error, and a live timegrapher trace for four positions. *Hold to wind*. |
| 4 | **Lettere dal Dottore** | One original short letter per day, the same for everyone on a given date. *Earlier* / *Later*, *Copy*, *Read aloud*. |
| 5 | **Clavicembalo** | A two-octave harpsichord. Play with a finger (glissando works), the mouse, or the keyboard (`Z`–`M` + `S D G H J`, `Q`–`I` + `2 3 5 6 7`). Four registrations, *Record* / *Play back* (saved), and a little original minuet. |
| 6 | **La Carica** | A winding game: drag up and down on the crown (or wheel / `↑`). Each ratchet tooth clicks and taps. Fill the barrel from empty; the score rewards speed and an even rhythm. Winding also fills the real reserve. |
| 7 | **Scacchi** | A chess problem of the day (ten built-in mates in one and two, each verified to have a unique solution). Tap a piece, then its square; *Hint*; *Previous* / *Next*. |
| 8 | **Biblioteca** | 26 public-domain passages (Dante in Longfellow's translation, Marcus Aurelius in Long's, Seneca, Horace, Virgil, Shakespeare, Pascal, Blake, Keats, Poe…). Filter by author, *Another*, *Keep* favourites, *Read aloud*. |
| 9 | **Firenze** | Four charcoal-and-sepia sketches (Duomo, Ponte Vecchio, Palazzo Vecchio, San Miniato) drawn in code in four depth layers. Move the pointer or tilt the phone for parallax. |
| 10 | **Ricorrenze** | Birthdays and anniversaries. They show as gold pips on the date sub-dial, marked days in the perpetual calendar, and a reminder when you open the watch on the day. |
| 11 | **Maree** | An astronomical tide dial: high/low water from the moon's transit plus your harbour's interval, spring/neap range, a 24-hour curve and an Earth–Moon–Sun diagram. Not for navigation. |
| 12 | **Atelier** | The watch assembled piece by piece from its own rendered layers: movement, case, dial, hands, crystal, regulation. *Assemble* or *Slowly*. |

## Ring I · Complicazioni (15 positions on the rotating bezel)
Pick a complication by clicking an icon on the bezel, pressing `←` / `→`, using the scroll wheel over the watch,
clicking the crown, or swiping on touch screens. On phones there is also a bottom dock.

| # | Complication | What it does and how to use it |
|---|---|---|
| 1 | **L'Ora (Time)** | The main dial: an 8-beat sweeping seconds hand, faceted dauphine hands whose facets catch the light, running seconds at 9, chronograph minutes at 3, and a moon phase with pointer date at 6. `CINCO CORPORATION` sits under 12 and is engraved on the rehaut. The panel shows digital time, date, day of the year, moon, Florence time, the next alarm and the countdown. |
| 2 | **Cronografo** | Stopwatch. Use `Space` to start or stop, `L` for a lap and `R` to reset, or click the real pushers at 2 and 4 o'clock. The central hand becomes the chronograph hand and the 3 o'clock register counts minutes. Best and worst laps are coloured. It survives a reload. |
| 3 | **Countdown: “Time until Clarice returns”** | Presets, a custom h:m:s, or “until” a date and time. A crimson arc on the dial shows the time remaining. When it ends you get a harpsichord cadence, a bell chime and a card. |
| 4 | **Sveglia (Alarm)** | Add alarms with a time, label and repeat days (leave the days blank for a one-time alarm). A crimson marker on the dial edge points to the next one. When it rings, a synthesized harpsichord toccata loops with Dismiss or Snooze (9 min). There is a test button. |
| 5 | **Fusi Orari (World time)** | Baltimore, Washington D.C. (Quantico), Memphis, Florence and Bimini. Each has a mini dial, 12/24h time, the date, the offset from local time, and a day/night dot based on real solar altitude. |
| 6 | **Fasi Lunari (Moon)** | Phase from Meeus's lunar theory, with illumination %, age, the next full and new moon and both quarters, and a monthly moon calendar you can page through. |
| 7 | **Fondello (Case back)** | The watch flips over in 3D. The engraved back reads `CINCO CORPORATION`, with the inscription *for a mind of refined taste*, the calibre and a serial number. Under the sapphire is an animated movement: gear train, stepping escape wheel, rocking pallet fork, a 4 Hz balance wheel with a breathing hairspring, and a gold rotor engraved `CINCO CORPORATION`. Drag to spin the rotor, which winds the watch. Hold the button to wind the crown. You can slow the view down to ¼× or 1/20×. `K` flips the watch from any mode, and so does a double-click. |
| 8 | **Menu du Jour** | Composes an engraved dinner card: amuse-bouche to dolce, with a wine for each course. You can set the occasion, season and number of guests. The food is ordinary fine dining. **Save card as PNG** downloads it. |
| 9 | **Quid pro Quo** | The watch asks you a question and you type an answer. It replies with a scripted, courteous remark chosen by keyword, then lets you ask it something in return. All the lines are original. |
| 10 | **Carboncino (Sketch)** | Charcoal, white chalk, blending and a kneaded eraser on toned, textured paper, with optional Florence or dial guides. Tick **Draw on the dial** to draw on the crystal. You can save the sketch or the dial as a PNG. |
| 11 | **The Interrogation** | A polygraph for trivial sins. Attach the brass sensor, answer five light questions with `Y`/`N`, and watch the scrolling pulse, GSR and respiration traces, BPM and heart, and the verdict stamps. You get a candour index at the end. The pulse sound is optional. |
| 12 | **Clavicembalo (Music)** | A Karplus–Strong harpsichord (two 8' strings plus a 4' string, reverb). The Baroque-style pieces are generated fresh each time: Aria, Invention, Prelude, Passacaglia and the Toccata. There is a piano roll, volume, tempo, “new variation” and continuous play. `P` plays or pauses from anywhere. |
| 13 | **Quadranti (Dials)** | Charcoal Florence, Crimson Cell, Bone Ivory, Night Vision (green phosphor, grain and scanlines) and Moth Wing. The seconds style can be sweep, tick or parked. The light can follow the cursor or tilt. `T` / `Shift+T` cycles dials. |
| 14 | **Case File (Dossier)** | An FBI-style case file on the watch, prepared for Cinco Corporation. It has tabs, a Polaroid of the live dial, a CONFIDENTIAL stamp, and redactions that reveal themselves when you hover or tap. It is entirely fictional. |
| 15 | **Impostazioni (Settings)** | 12/24h, moths (on/off and count), fog, ticking, hourly chime, light-follow, night-vision grain, reduced motion and volume. It also has shortcuts, an intro replay, fullscreen and reset. Everything is saved in localStorage. |

## Ring II · Il Salone (13 more)
Switch rings with the **I Complicazioni / II Salone** tabs under the watch, the `V` key, or the ring button at the left of the phone dock. Each ring remembers where you were.

| # | Salon | What it does and how to use it |
|---|---|---|
| 1 | **Turbine (Tourbillon)** | A close-up of a one-minute tourbillon. The carriage turns once a minute, the escape wheel rolls around a fixed gold wheel, and the lever and the 4 Hz balance with its blued hairspring move with it. You can run it in real time, slow motion or 6× speed. Tick **Keep the tourbillon aperture on the dial** to replace the moon phase at 6 o'clock with a live tourbillon on the main dial. |
| 2 | **Ripetizione (Minute repeater)** | Strikes the current time on two synthesized gongs: low strikes for the hours, ding-dongs for the quarters, high strikes for the minutes. The hammers, the glowing gongs and a whirring governor are animated. Use **Strike the time**, `C` from anywhere, `Enter` in this mode, or click the repeater slide on the left flank of the case. |
| 3 | **Sole (Sun)** | Sunrise, sunset, solar noon and day length, the morning and evening golden hours, the blue hour, and a daylight arc showing where the sun is now. The default location is Weatherford, Texas. **Use my location** asks for geolocation (opt-in) or you can type coordinates. It all works offline. |
| 4 | **Stelle (Star chart)** | A planisphere of the sky for your location and time. It has about 110 bright stars, constellation lines and names, and the Moon with its phase. Drag the time slider ±12 h, hover over a star for its name, and read which bright stars are overhead. |
| 5 | **Sedute (Sessions with the Doctor)** | A focus timer (Pomodoro) with 4 sessions to a set and short and long rests. It shows a gold arc on the dial while you focus and green while you rest. Between sessions the Doctor offers a short original remark, spoken aloud if you choose. **Dim the room during focus** darkens the rest of the page. There are daily and weekly stats. `Space` starts or pauses. |
| 6 | **Appunti (Session notes)** | A private journal with a title, text and timestamps, stored only in this browser. You can edit, search and delete (two clicks). **Print** gives a letterheaded Cinco Corporation page, and **Export .txt** saves a file. |
| 7 | **Cantina (Wine cellar)** | Pick tonight's dish for a sommelier's suggestion on an engraved card, or **Surprise me**. Keep a cellar book with the wine, vintage, region, quantity (±) and drinking window, and each bottle is marked *too young / ready / past its best*. |
| 8 | **Su Misura (Bespoke)** | The case metal (polished steel, platinum, yellow gold, rose gold, bronze, black DLC, or the dial's default) and the strap (black calf, cognac, oxblood or midnight alligator, or a three-link steel bracelet), with a live preview on a strap. The metal restyles the case, crown, pushers, bridges and case back everywhere. It is saved. |
| 9 | **Incisione (Engraving)** | Type your own inscription for the case back (copperplate script, Roman capitals or typewriter), plus an optional dedication such as **Today, in Roman**. The close-up updates as you type, and **Engrave it** cuts it in with a burin-spark sweep. **Restore the original** puts the factory inscription back. |
| 10 | **Ambiente (Soundscape mixer)** | Five procedurally synthesized layers, each with its own slider: cell ambience (a hum, a draught, drips), rain on the glass, a candle's crackle, a generative harpsichord and a longcase clock's tick. There are presets, a live waveform, and the mix is remembered. |
| 11 | **Comodino (Nightstand)** | A dim, full-screen bedside clock with luminous hands or numerals only. It drifts slowly to protect the screen and wakes on any input. You can set the brightness and have it start itself after 1 to 10 idle minutes. `Z` or the moon button in the header starts it. |
| 12 | **Vetrina (Showcase)** | Exports a 1800×2400 PNG catalogue photograph of your exact configuration (dial, metal, strap, tourbillon, engraving) on Cinco Corporation letterhead, with an inset of the case back. It can also share (where supported), install the app, and show offline status. |
| 13 | **Segreti (Secrets)** | 25 achievements with a progress bar and unlock medals. Some are in plain sight and some are hidden: try the old code on the keyboard (↑↑↓↓←→←→BA) for a moth storm, and click the crown five times quickly for a hidden dial. |

## What's new in rendering (v2)
- Brushed case band, softbox reflections and bevel highlights that follow the light. The sapphire crystal has tilted reflection panes, an anti-reflective bloom and an edge-refraction ring. The rehaut has a depth shadow.
- Lume glows softly on the hands and indices in darker dials (it can be turned off in *Quadranti*).
- Smoother hands: eased beats for the seconds hand and a flyback tween when the chronograph resets.
- A cinematic introduction: CINCO CORPORATION is typed letter by letter, then *Enter, please* brings in a short synthesized score while the watch swings into the light, a glint crosses the crystal and the title writes itself. `Esc` or **Skip** jumps ahead.
- Mode changes slide in the direction you turn, the ring swap animates, and the mode names are set in refined caps.
- **Performance:** the target is 60 fps. If a device struggles, heavy effects (shadows, extra moths, grain) scale back automatically. When the tab is hidden or the watch is scrolled out of view, the render loop stops and only the once-a-second clock keeps running, so alarms still ring.
- **Accessibility:** labelled buttons and canvases, visible focus rings, a skip link, a live region that announces mode changes and the time, focus management in dialogs, and reduced-motion support.
- **Voice (optional):** in *Impostazioni*, turn on the voice. It speaks the time (`S`) and, if you like, the Quid pro Quo replies and session remarks, choosing a British English voice when your system has one.

## Atmosphere
- **Death's-head moths**: sprite-animated hawkmoths circle the watch like a lamp and scatter from the cursor or a click. Hover over one to see its name. Toggle with `M`.
- **Breath on the glass**: `B`, the Breathe button, or a long-press on the crystal fogs it with patchy condensation. Wipe it with the cursor or a finger, or write in it. It evaporates on its own.
- **Live lighting**: the light direction follows the cursor, or the tilt of a phone. The case sheen, sunburst dial, crystal glare and hand shadows all respond to it.
- Mouse parallax tilt, a charcoal Florence sketch in the backdrop, and an introduction card reading “Cinco Corporation presents”.

## Keyboard
`←/→` or `[ ]` bezel · `1–9, 0` jump · `Space` chrono (music in Music) · `L` lap · `R` reset · `T/Shift+T` dial · `K` flip ·
`B` breathe · `M` moths · `P` music · `H` 12/24h · `F` fullscreen · `Y/N` interrogation · `?` help · `Esc` close ·
`V` switch ring · `C` minute repeater · `S` speak the time · `Z` nightstand

## Touch
Swipe left or right to change complication. Long-press the crystal to breathe on it. Tilting the device moves the light and swings the rotor on the case back. There is a bottom dock for quick access.

## Notes
- Browsers only allow audio after your first click or keypress. The intro's “Enter” button unlocks it.
- Alarms, countdowns and sessions only fire while the page is open.
- Your notes, cellar, engraving, settings and achievements live in this browser's localStorage and never leave the device.
- Sun times use a standard solar algorithm (about a minute of accuracy) and are shown in the device's time zone. The star chart is approximate: bright stars and the Moon, no planets.
- Voices depend on the operating system. If there is no British voice, the default English voice is used.
- Fonts are Cinzel, Cormorant Garamond and Pinyon Script (SIL OFL 1.1) and Special Elite (Apache 2.0). See `/fonts`.
- The Lecter “Il Dottore” C-1991 and Cinco Corporation are fictional. This is an affectionate homage with no affiliation with any film, studio or author. It contains no gore and no film dialogue.
