# Cinco Corporation presents: The Lecter
### “Il Dottore” · Calibre C-1991 · Automatic Chronograph

A luxury-watch web app, rendered entirely in code: Canvas 2D, Web Audio, HTML and CSS.
It has no build step, loads nothing from a CDN and makes no network requests. The fonts are bundled.

## Run
```bash
cd lecter-watch
python3 -m http.server 8000     # then open http://localhost:8000
```
Opening `index.html` straight from disk also works. Add `?noboot` to the URL to skip the introduction.

## The complications (15 positions on the rotating bezel)
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

## Atmosphere
- **Death's-head moths**: sprite-animated hawkmoths circle the watch like a lamp and scatter from the cursor or a click. Hover over one to see its name. Toggle with `M`.
- **Breath on the glass**: `B`, the Breathe button, or a long-press on the crystal fogs it with patchy condensation. Wipe it with the cursor or a finger, or write in it. It evaporates on its own.
- **Live lighting**: the light direction follows the cursor, or the tilt of a phone. The case sheen, sunburst dial, crystal glare and hand shadows all respond to it.
- Mouse parallax tilt, a charcoal Florence sketch in the backdrop, and an introduction card reading “Cinco Corporation presents”.

## Keyboard
`←/→` or `[ ]` bezel · `1–9, 0` jump · `Space` chrono (music in Music) · `L` lap · `R` reset · `T/Shift+T` dial · `K` flip ·
`B` breathe · `M` moths · `P` music · `H` 12/24h · `F` fullscreen · `Y/N` interrogation · `?` help · `Esc` close

## Touch
Swipe left or right to change complication. Long-press the crystal to breathe on it. Tilting the device moves the light and swings the rotor on the case back. There is a bottom dock for quick access.

## Notes
- Browsers only allow audio after your first click or keypress. The intro's “Enter” button unlocks it.
- Alarms and countdowns only fire while the page is open.
- Fonts are Cinzel, Cormorant Garamond and Pinyon Script (SIL OFL 1.1) and Special Elite (Apache 2.0). See `/fonts`.
- The Lecter “Il Dottore” C-1991 and Cinco Corporation are fictional. This is an affectionate homage with no affiliation with any film, studio or author. It contains no gore and no film dialogue.
