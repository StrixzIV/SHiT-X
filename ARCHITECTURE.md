# iLeak architecture

> Detect electricity in flood water by dipping one end of a cable in it and plugging the other end into your device. USB-C works best, but any wired port counts.

The first version (agy/Gemini) did all detection through one browser API, `navigator.getBattery()`, with a manual toggle as the fallback. That API exists only in Chromium. On iPhone, Safari and Firefox the app could do nothing except fake it. This version treats *every wired interface a device exposes* as a possible probe and scores them together.

## Code layout

The first screen is a **graphic quality** choice (`src/App.jsx` → `src/quality/components/QualitySelectGate.jsx`, stored as `?q=low|medium|high`). `src/quality/QualityRouter.jsx` lazy-loads one tree per quality:

- `src/quality/high/`: the full app described in this document (App, components, pages, fx, scenes, DEV panel)
- `src/quality/medium/`: the "Premium UI Library" tree — luxury gradients, glass, neon and a gold certificate, each block in a different design language with zero consistency. `src/quality/low/`: a student's raw-HTML assignment (default browser styles, `border="1"` tables, one `<marquee>`). Both reuse the shared `appraisal/`, `game/` and `probes/` code and set/reset `document.body` styles in a cleanup effect.

Shared, quality-independent code stays at the top of `src/`: `appraisal/`, `game/`, `probes/`, `geo/`, `index.css`. UI paths below such as `fx/…`, `components/…` and `pages/…` are relative to `src/quality/high/`. `?dev` skips the quality gate (High), and the gate itself also shows the DEV tickbox.

## Layers

```
┌────────────────────────────────────────────────────────────────────┐
│  AgreementGate (every load) → MainPage                             │
│   1 Appraisal: spec readout → wattage dial → tier stamp (mult₁)    │
│   2 Peripherals: tap to connect, each live one raises mult₂        │
│   3 HoldButton → CalcOverlay: tally on black → scene L0–L7 → sheet │
│  fx/: scenes/L0–L7 + Boot · gl/ (low-poly) · audio + sfx · juice  │
├────────────────────────────────────────────────────────────────────┤
│  appraisal/specs.js — read specs, estimate brick watts, tiers      │
│  game/score.js      — pure: chips × mult₁ × mult₂ → total, level   │
├────────────────────────────────────────────────────────────────────┤
│  probes/useProbes.js — owns adapter lifecycle, merges state        │
├────────────────────────────────────────────────────────────────────┤
│  probes/adapters/* — one file per wired interface                  │
├────────────────────────────────────────────────────────────────────┤
│  Platform: Web APIs  │  Native shell bridge (window 'ileak:native') │
└────────────────────────────────────────────────────────────────────┘
```

### Adapter contract

Each adapter is a factory that returns:

| field | meaning |
|---|---|
| `id, name, label, port` | identity; `port` is `USB-C`, `3.5mm`, `Ethernet`, … |
| `mult` or `xmult` | scoring bonus: `+mult` adds, `xmult` multiplies |
| `support()` | `{ ok }` or `{ ok: false, why }`. If not ok, the card is shown "debuffed" with the reason |
| `start(update)` | optional, passive listening that needs no permission. Returns `stop()` |
| `arm(update)` | optional, runs on a tap because the API needs a user gesture (permission prompt) |
| `tap(update, state)` | optional, replaces `arm` (used by Placebo) |

`update(patch)` merges into `{ supported, armed, live, reading, detail, port?, mult?, xmult? }`.
`live` means "this cable currently carries electricity", and `reading` is the number of chips it adds.

Adapters never import React. To add a port, write one file and add it to `probes/index.js`. Nothing else changes.

`useProbes` lives in `App`, not in a page, so open serial ports and mic streams keep running when you switch pages.

### Appraisal (`appraisal/specs.js`)

Browsers never expose charger wattage, so `estimateWatts` infers the brick from hardware class and takes the highest match:

- GPU name from `WEBGL_debug_renderer_info` on a `high-performance` context (so hybrid laptops report the dGPU), with a paren-aware ANGLE parser. WebGPU adapter info (vendor / architecture) is a second source and catches an NVIDIA dGPU hiding behind the iGPU (RTX xx80/90 Laptop → 280 W, desktop RTX → PSU 650–1000 W, Apple M Max → 140 W, iGPU → 65 W, flagship Adreno → 45 W, …)
- CPU threads (≥ 24 → 280 W "HX class", ≥ 16 → 140 W). Hybrid-graphics laptops often show the iGPU to the browser, so this catches them.
- a live reading from `battery.chargingTime` when charging (assumed 80 Wh laptop / 17 Wh phone)
- the user can override the wattage; it is labelled "self-declared"
- other rows: physical screen resolution + measured refresh rate, Windows 10/11 from UA-CH `platformVersion`, laptop vs desktop from the battery state
- dev mode shows the raw strings the browser returned (`specs.raw`), so a wrong guess can be diagnosed on the actual device

The meter swaps to a bigger instrument for each range, so the needle always stays on the scale: มัลติมิเตอร์ตลาดนัด (5 W–1 kW) → มิเตอร์การไฟฟ้า (–1 MW) → แผงโรงไฟฟ้า (–1 GW) → ฟลักซ์คาพาซิเตอร์ (–1 TW) → หอดูดาวสุริยะ (–1e17 W) → มาตรวัดคาร์ดาเชฟ (–1e27 W) → มาตรวัดพลังพระเจ้า. See `appraisal/meters.js`.

| Tier | Brick | mult₁ | |
|---|---|---|---|
| Ω | ≥ 1e40 W | 9999 | ผู้สร้างจักรวาล |
| K-II | ≥ 3.8e26 W (the Sun) | 987 | Kardashev II |
| K-I | ≥ 1e16 W (a planet) | 610 | Kardashev I |
| TW | ≥ 1 TW | 377 | ดวงอาทิตย์พกพา |
| GW | ≥ 1 GW | 233 | 1.21 จิกะวัตต์! |
| MW | ≥ 1 MW | 144 | เจ้าของเขื่อน |
| kW | ≥ 10 kW | 89 | เครื่องปั่นไฟงานวัด |
| SSSS | ≥ 2 kW | 55 | หม้อหุงข้าว 10 ใบ |
| SSS | ≥ 600 W | 21 | |
| SS | ≥ 330 W | 13 | |
| S | ≥ 200 W | 8 | 280 W gaming laptop |
| A | ≥ 100 W | 5 | |
| B | ≥ 61 W | 3 | |
| C | ≥ 30 W | 2 | |
| D | ≥ 10 W | 1.5 | |
| F | < 10 W | 1 | |

Auto-detection never goes past ~1 kW. Anything higher comes from the wattage list or dev mode. Above 1 kW the dial needle breaks loose and spins.

### Scoring (`game/score.js`)

The result is a Balatro hand, and `computeScore` returns the `steps` the calculation screen plays one by one, each with its own sound:

1. **Chips**: the brick watts, then the spec bonus (threads × 10 + RAM GB × 8 + screen megapixels × 10)
2. **+Mult**: one per live peripheral (USB-C +2, other ports +1, Placebo +0.5), starting from 1. The battery is excluded because it decides "powered" instead.
3. **×Mult**: the tier multiplier
4. **×0**: if nothing is powered (not charging and no live peripheral) → total 0 → safe

total = chips × mult. The level (0–7) picks the result scene: thresholds 0, > 0, 2,000, 8,000, 30,000, 100,000, 1e8, 1e15. See "Result scenes".

## Result scenes (`fx/CalcOverlay.jsx`, `fx/scenes/`)

1. **Loading:** our take on the PS2 boot screen (`fx/scenes/Boot.jsx` + `ps2boot.js`, ported from the PS2 skin in the same author's ft_blueprint: `src/skins/consoles/ps2.ts` `ps2Boot` and `src/gfx/scenes/ps2.ts` `ps2Scene`). Black space with blue fog drifting in two layers, six tumbling glass cubes, and four coloured lights (red, green, violet, blue) with glowing heads and hairline trails; a low hum and glassy chimes. With WebGL2 the cubes are real clear glass: two passes, the backdrop and trails into a texture, then each pixel traced through the cubes, bent going in and out like a slab of glass 1.5 and on to the other cubes or the wall, with a faint Fresnel reflection. Without WebGL2 they fall back to the canvas original's dark glass with a sliding reflection band. Drawn at console resolution. On top, the Balatro-style tally plays (chips / +Mult / ×Mult / ×0, with sounds), then the total ticks up.
2. **The way out (`ZOOM_S`, 2.4 s):** when the count finishes, the camera dives in faster and faster while rolling anticlockwise. Each layer grows at its own rate, so the near cubes glint and rush past and the lights stretch into streaks. The era's frame-stacking blur: the previous frame is laid over each new one, faded (85% a frame), so everything that moves leaves a trail of fading copies of itself. A short blue-white flare ends the dive (~1.4 s). Then comes a beat in the void: the cubes and lights are gone and only the smoke (the fog) is left, drifting closer and fading out. The hum drops away, and a low swell and a rising hiss build into the cut. The tally spins off anticlockwise with a blur as the dive starts. With reduced motion it just fades to black.
3. **The level's scene** (L7 fades up slowly from black). Each scene opens its own sound session (`fx/audio.js`), which stops with the scene.
4. **Result sheet** slides up over the still-running scene after `SCENE_MS[level]` (L0 7.4 s with its lives screen, L6 13 s, L7 10.5 s; the rest 4.5–12.5 s).

**PS1 / PS2 look.** The switch at the top right of the header (`components/RetroSwitch.jsx`, state in `retro.js`, `LOOK`) sets how the scenes render. Every load starts on PS2; there is no "original" mode. L0 (Famicom), L1 (XP blue screen) and L5 (GBA) keep their own platform look either way.

| | PS2 | PS1 |
|---|---|---|
| Resolution | 448 lines, upscaled with hard pixels (no anti-aliasing, so edges stay jagged) | 240 lines |
| Colour | full, plus bloom and a faint interlace shimmer | 15-bit with ordered (Bayer) dithering |
| 3D | bilinear textures | vertices snapped to whole pixels (wobble), affine (warping) textures, nearest-neighbour |

The 3D scenes (L2–L4) share a small WebGL1 renderer in `fx/gl/` (`m4.js` maths, `mesh.js` flat-shaded shapes: box, tube, ball, beam, sprite, height field; `retroGL.js` the renderer and PS2 post-pass; `useRetroGL.js` the React hook). Flipping the switch mid-scene only changes the look; the scene clock keeps running.

On **L7**, `fx/scenes/orbit.js` takes over after the slide-up: the black hole pulls the sheet into a perspective orbit, with its base size now 30% smaller. The lap is a Kepler ellipse with the hole at one focus, so the card drifts slowly through the open sky (top right; top centre on portrait screens) and whips round the hole, partly off-screen, for about a quarter of each 16 s lap. Hover, clicking, tapping and keyboard focus never slow or enlarge it: there is no sticky reading mode. Drag and release to fling it; gravity brings it back around. On touch screens, the heading is the drag handle and the body scrolls normally.

After **20 seconds without interacting with the card**, the hole swallows it automatically. The existing spiral/stretch animation runs, the card becomes inert and invisible for **three seconds**, and then it is spat back into orbit with the Hawking-radiation subtitle. The cycle repeats if it is left alone again. Pointer presses/releases, dragging, keyboard input/focus, scrolling and wheel events reset the idle deadline; hover alone does not. A held card is protected until release; a focused card continues orbiting and can still be swallowed if abandoned. Idle and hidden waits use wall time so low shader frame rates cannot stretch those deadlines. Dropping it into the shadow uses the same swallow/return sequence. Reduced motion keeps the sheet docked without the idle effect, and certificate printing removes the orbit transform and mask.

**L7 UI lensing.** `fx/scenes/uiLens.js` generates two cached 128×128 displacement maps with a small GLSL shader: a softened point lens with gentle swirl, and a stronger swallow swirl. An SVG `feDisplacementMap` uses these fields to bend the live HTML card, including its text, borders, controls and certificate. The field follows the hole from `shot()` in the card's local coordinates; it intensifies near the hole and curls during swallowing. The interactive card remains live HTML. Browsers without WebGL generate the same fields with Canvas 2D. Zero-strength/hidden states bypass the filter, and the initial slide-up stays unfiltered.

The orbit converts pointer positions through the displacement field to find the visible control's native source target. It rejects fully shadow-masked pixels and temporarily removes paint filters/masks only for the synchronous hit lookup. During dragging, the field is biased to leave the grabbed source pixel under the pointer. A selective `touchstart` handler blocks panning for the bent heading; the body still scrolls. Keyboard activation stays native and never starts reading assistance. Reduced motion skips both orbit and UI lensing; printing removes the displacement filter, and closing the overlay removes its SVG definitions.

**L7 light around the black hole itself.** The Gargantua fragment shader also samples a texture of the actual result UI. `fx/scenes/uiLight.js` uses `html-to-image` to capture its styled content without its orbit/filter/mask. It recaptures after content, font or size changes, including issuing a certificate, rather than on each orbit frame. Live position, inverse rotation/scale/stretch, scroll and opacity reach the shader every frame. Escaping bent rays produce secondary UI images; a deliberately broadened logarithmic foreground lens makes a larger, inverted, curved image visible along the rim at console resolution. This foreground effect is artistic, not a physically scaled ray trace of the HTML. The blue XP title bar, text and controls wrap around the hole and follow dragging. UI light never paints inside the shadow and disappears with the consumed card. Reduced motion redraws on content/size/scroll changes, without an animation loop. Closing the overlay disconnects observers and deletes the texture and other GL resources.

| Lvl | Scene | Sound (synthesized unless a file is supplied) | Drop-in files (`public/fx/`) |
|---|---|---|---|
| 0 | First the NES-style black lives screen (the HUD, WORLD 0-0, Claude × 3) for 2.4 s in silence, then a Famicom-style underwater stage, 240 px tall and as wide as the screen (portrait phones get a taller water column). The hero is Claude Code's mascot (block-for-block from its welcome banner) in a hard hat, swimming with its USB-C cable trailing behind and saying "BUILDING iLEAK..."; fish, coral, HUD | Short opening excerpt of the original Super Mario Bros. (1985 NES) Underwater theme, checked against its note/frame data: two 50% pulse voices and triangle bass; opening climb once, then repeat the first melody phrase; bubble blips and a bloop when Claude speaks | `l0-underwater.mp3` |
| 1 | XP-style blue screen (own wording) with sparks and a little smoke: a big burst every ~1.8 s, small fizzes between | only the 8-bit spark crackle, on each big burst | — |
| 2 | Heaven, for laughs, the way a PS2 game would try for it (low-poly 3D): cut to blinding white on the steps, then the camera tilts up a janky low-poly stairway (every slab a little off) through "trying to be realistic" billboard clouds (noise-generated cumulus cards: lit tops, grey-blue undersides) under low-poly god-ray shafts, to the crowd waiting at the top: a band cut from the "everyone in heaven" meme collage, glowing from behind | angel choir "ahh" chords + harp glissando, generated reverb | `l2-heaven-crowd.jpg` (the crowd: any wide picture, about 2.3:1), `l2-heaven.mp3` (`heaven.jpg` is no longer used) |
| 3 | Low-poly 3D: a flooded soi at night (shophouses with lit windows, power poles and sagging wires, rippling water, rain); lightning bolts light everything up, and the figure at the end of the street only shows in the flashes | crack + rumble per strike, rain bed | `lowtiergod.png` / `.jpg` / `.webp`: a transparent cut-out stands at the end of the street as a giant, a plain photo fills the sky (else a dark silhouette with glowing eyes) |
| 4 | Low-poly 3D: someone knee-deep in the flood, phone up, USB-C cable in the water, shaking; flickers body → X-ray skeleton → white-out, purple arcs crawl over them, the jaw drops on each FAHHH | electric buzz + synthesized "FAHHH" | `l4-fahh.mp3`, `fahh.mp3` or `fahhhhhhhhhhhhhh.mp3`, played at the cut and ~2.6 s later at `FAHH_GAIN` (0.35, top of `L4Skeleton.jsx`; meme clips are mastered very loud) (`skeleton.png` is no longer used) |
| 5 | GBA-style wild battle: flash + stripe wipe, then PLUGCHU (original electric plug creature). You use THUNDER, it's not very effective, it absorbs 220 V, it uses THUNDER, you faint | Short opening excerpt of Ruby/Sapphire/Emerald's wild-battle theme at 196 BPM, checked against `mus_vs_wild.mid`: chromatic intro once, then repeat the following horn phrase; source bass, harmony and snare/timpani timing with synthesized instruments. Music begins during the flash/wipe and fades at fainting, leaving attack / HP-drain / faint effects and text blips | `l5-battle.mp3`, `l5-opponent.png` / `.jpg` / `.webp` (rename via `OPPONENT` in `L5Battle.jsx`) |
| 6 | "ภัยพิบัติระดับหมอลำ" as a Codec call (our own take on the PS-era spy-game radio screen), 4:3 at console resolution: your portrait (hard hat) and the commander's (cap, sunglasses), the 220.50 frequency, level meters, and a typed Thai conversation with the live voltage | Metal Gear-style digital trills in three ring bursts, descending connect chirp with static, quiet radio hiss after connection, subtle text clicks and short squelch per line; a Thai voice reads the lines if the device has one, with quieter clicks under speech | `l6-radio.mp3` (replaces the static bed) |
| 7 | Gargantua: WebGL ray-marched black hole, rays bent by the Schwarzschild photon equation (lensed disk, photon ring, Doppler-bright side, lensed star field). A telephoto shot of the hole's top-right with a slight camera roll (`fx/scenes/gargantua.js`, shared with the orbit), fading up from black over ~4.5 s; PS2 448 lines, PS1 240 lines with dithering | heavy distorted drone: detuned saws through a resonant swept filter and overdrive, sub, whooshes, slow downward pitch bend | `l7-space.mp3` |

**Drop-in files** are optional. Each scene tries its file first and falls back to synthesized sound or art when the file is missing. On Firebase a missing path returns `index.html`, which just fails to load. L0/L5 now contain short opening excerpts based on the named game themes' notes; their browser instruments approximate the sound. Full original soundtrack recordings are not bundled. Optional audio files, character art, a real person's photo, or a meme clip are the team's own files to add. L0 tries music after its silent lives screen; L5 tries its supplied track from scene start so the file's own intro replaces the whole synthesized score.

`fx/scenes/sceneAudio.js` holds the reference-checked L0/L5 opening excerpts as readable pitch tokens, plus L6's Codec cues. Tokens now advance musical time: `C5:2` occupies two grid cells and `.:4` is a four-cell rest; a third value specifies MIDI velocity, e.g. `G3:2:60`. Sustained cells become nulls so they do not retrigger. L0 uses a 48-cell excerpt of 384 NES frames (~6.39 s), looping from cell 24; L5 uses the first 576 MIDI ticks, 96 cells (~7.35 s), looping from cell 32. `loopStart` in `fx/audio.js` plays the opening once and then repeats the selected phrase. Pulse/brass voices, note holds and filtered drums provide synthesized timbres, rather than original GBA samples. Finite scores cancel their scheduling timer, and ended notes disconnect and leave the session's retained-node set. DEV speed scales the scores and Codec cues with scene timing; L5's music stops at its 11.8 s fainting event, including a drop-in track. See `handoff/2026-10-11-original-theme-correction.md` for sources and fidelity checks.

The taskbar speaker toggles the shared master gain (`fx/sfx.js`) for synth and file audio. It is disabled while an overlay covers the taskbar, so choose mute before opening a scene; the shared mute API also silences audio already playing.

## Dev mode

The **DEV tickbox** sits in the top-right of the header and is always visible. `?dev` in the URL does the same, and ticking the box writes `?dev=1` so it survives reloads. Ticking it opens a panel under the box (▾ / ▴ folds it). The whole header sits above every overlay (agreement, calculation, blue screen, black hole), so the tickbox and panel are reachable everywhere. Overlays read the header's measured height from `--header-h` and start below it. Nothing dev-related applies while the box is unticked.

- **ข้าม (skips, each toggleable live):** agreement page · iOS block · region block · appraisal animation · forced manual charge · calculation (straight to the result with its effects) · 0.3 s hold
- **ค่า (knobs):** any wattage (`280`, `1.21e9`, `1e42`) or a tier button · power auto / on / off · fake USB-C devices · speed 1× / 3× / 10×
- **ยิง FX:** the real score, or any level L0–L7
- **Stress test:** all levels L0→L7 back-to-back (each result closes itself, the last stays) · real score ×5 · a random wattage every 0.35 s for 10 s · 50 fake USB-C · max chaos (Ω + 30 fake devices + powered) · stop · FPS meter
- **Tools:** replay the appraisal · reopen the agreement · reset · raw spec dump (exactly what the browser reported)

## Charging: read it, or make the user charge by hand

| Situation | What the app does |
|---|---|
| Battery API works | Live status, polled 4×/s and re-acquired every 1.5 s. "ตรวจซ้ำ" re-reads it. If that doesn't change anything, "โหลดหน้าใหม่" appears (see below). The "ยืนยันเอง" tick stays optional. |
| Battery API missing or fake (Safari, Firefox, Brave, plain http; iOS only gets here through the DEV skip) | Forced manual mode. The dip button is replaced by "ไปชาร์จด้วยมือก่อน" until the user presses **⚡ ชาร์จด้วยมือ**, which cranks a battery from 0 to 100%, or **ไม่ได้เสียบสาย**. |

**Why reload is the real re-check (Chromium).** `BatteryStatusService` starts the OS listener (UPower over D-Bus on Linux) when the first page subscribes. It stops and forgets the state when the last subscriber leaves (`battery_status_service.cc`). If a UPower signal is missed, polling `battery.charging` in the page can't recover, because the renderer only gets pushed updates. A reload with no other tab using the battery restarts the listener and reads fresh values. "โหลดหน้าใหม่" sets a one-shot `sessionStorage` flag, so that one reload skips the agreement the user already accepted. A normal reload still shows it.

## Device support matrix (verified, see "Fact check")

Version numbers are from MDN browser-compat-data 8.1.5. "WebView" means Android System WebView, which is what LINE, Facebook, Messenger, Instagram and TikTok use on Android. iOS covers every iOS browser (all WebKit in Thailand) and iOS in-app browsers.

| Card | API | Chrome / Edge / Opera (desktop) | Chrome Android / Samsung Internet | Android WebView (in-app) | Firefox (desktop) | Firefox Android | Safari (macOS) | iOS |
|---|---|---|---|---|---|---|---|---|
| สายชาร์จ (decides "powered") | Battery Status | ✅ 38+, https only since 103. Brave returns a fixed fake value | ✅ | ✅ | ❌ removed in 52 | ❌ | ❌ | ❌ |
| โพรบ iLeak | Web Serial | ✅ 89+ (Brave: off by default) | ✅ Chrome 148+ (138–147: Bluetooth ports only) | ❌ | ✅ 151+, after a site-permission add-on prompt | ❌ | ❌ | ❌ |
| อุปกรณ์ USB | WebUSB | ✅ 61+ | ✅ | ❌ `navigator.usb` exists but does nothing (crbug 41441927) | ❌ | ❌ | ❌ | ❌ |
| แจ็คหูฟัง / ไมค์ | getUserMedia | ✅ | ✅ | ⚠️ the host app decides | ✅ | ✅ | ✅ 11+ | ✅ (in-app: the host app decides) |
| จอนอก | `screen.isExtended` | ✅ 100+ | exposed, always false | — | ❌ | ❌ | ❌ | ❌ |
| คีย์บอร์ด / เมาส์ USB | WebHID | ✅ 89+ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| เครื่องดนตรี MIDI | Web MIDI | ✅ 43+ | ✅ | ✅ | ✅ 108+, after a site-permission add-on prompt | ❌ | ❌ | ❌ |
| กล้อง USB | getUserMedia + labels | ✅ | ✅ | ⚠️ the host app decides | ✅ | ✅ | ✅ | ✅ iPad external cameras |
| จอยเกม | Gamepad (https only: Chrome 86+, Firefox 81+) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ 10.1+ | ✅ |
| เมาส์บนมือถือ | `any-pointer: fine` | n/a | ✅ | ✅ | n/a | ✅ | n/a | ✅ iPad |
| สายแลน | `navigator.connection.type` | ChromeOS only | ✅ (Brave disables it) | ✅ 50+ | ❌ | ❌ | ❌ | ❌ |
| ปุ่มจำลอง | none | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

Every sensor needs a secure context (https or localhost). On a plain-http LAN address the battery, USB, Serial, MIDI, mic, camera and gamepads are all switched off, so phone testing must go through Firebase (https).

### Devices the appraisal recognizes (`appraisal/devices.js`)

- **Special hardware** overrides the GPU guess: Tesla (250 kW Supercharger → kW tier), Xbox, PlayStation, Nintendo Switch, Steam Deck, Meta Quest, smart TVs (Tizen / webOS / Android TV …), Kindle, Raspberry Pi, Chromebook
- **Android** by model code (UA-CH `model`, or the `Android 13; <model> Build/` part of WebView UAs): Samsung (S Ultra 45 W …), Pixel, Xiaomi / Redmi / POCO, realme (GT 240 W), OPPO / OnePlus, vivo / iQOO, Huawei / Honor, Nothing, Infinix, TECNO, Motorola, Sony, ASUS ROG
- **Apple** models by portrait screen size (iPhone SE → 17 Pro Max, iPad mini → iPad Pro 13")
- **Browsers**: Chrome, Edge, Opera, Samsung Internet, Firefox, Safari, Brave, Vivaldi, Yandex, UC, DuckDuckGo, console/TV browsers, and in-app browsers

### iOS is blocked

Every iOS browser is WebKit in Thailand (the EU-only alternative-engine rules don't apply). WebKit gives pages no charging state, USB, Serial, HID or MIDI. iPhones and iPads get a joke screen with no way through (`components/IosBlock.jsx`). It shows "เสียใจด้วยนะ ชาว iOS", a random excuse, an appeal button that always gets rejected, and a share button to open the link on a computer or Android. Only the DEV skip "ข้ามหน้าบล็อก iOS" gets past it, for testing.

### Region block (`src/geo/`, `components/AfricaBlock.jsx`)

Merged from `feat/geo-blockade`. On load the High app looks up the visitor's country with free IP-geolocation services (`api.country.is`, then `ipwho.is`), cached per session. Visitors from African countries get the "Your region doesn't have floods" page instead of the app. It sits next to the iOS block, under the header, so DEV stays reachable. `?country=XX` (or `?test_country=XX`) forces a country for testing. The DEV skip "ข้ามหน้าบล็อกภูมิภาค" bypasses it. The branch also includes a Firebase Cloud Function version (`functions/`, Blaze plan) and copies `index.html` into `functions/dist` during `pnpm build`.

### Browser compatibility

The build targets `es2019 / chrome79 / edge79 / firefox78 / safari13`. Tailwind v4 was removed because it needs Safari 16.4+ / Chrome 111+; a small reset replaces it. Newer APIs are feature-checked: `Intl.Segmenter` falls back to a Thai-aware regex, Pointer Events fall back to touch and mouse, and every adapter's `support()` and `start()` is wrapped, so one broken API can't take the page down. The CSS has fallbacks for `inset`, `dvh` and `-webkit-backdrop-filter`.

**Audio is the universal fallback.** Every phone and computer has a mic input, either a 3.5mm TRRS jack or a USB-C audio dongle. The แจ็คหูฟัง / ไมค์ card:
- counts any *wired* input it detects by label (`USB`, `headset`, `wired`, …) as live, and
- detects a tone from the iLeak Probe (frequency ∝ mV). This makes it a one-way wired modem for browsers without Web Serial or WebUSB, such as Firefox and Safari on macOS.

Mic access requires HTTPS, so for phone demos use `vite --host` behind HTTPS or deploy the app.

## Fact check (October 2026)

| Claim in the app | Verdict | Source |
|---|---|---|
| Battery API: Chrome / Edge / Opera / Samsung / Android WebView yes; Firefox removed it in 52; Safari and iOS never had it; https-only since Chrome 103 | ✅ | MDN BCD `api.Navigator.getBattery` |
| Brave fakes the battery | ✅ fixed value | Brave wiki "Deviations from Chromium" |
| Android in-app browsers block the battery | ❌ **was wrong.** WebView supports it; only USB / Serial / HID are missing, and the mic and camera depend on the app. Banner fixed. | BCD `webview_android` |
| WebUSB works wherever `navigator.usb` exists | ❌ **was wrong** for WebView (exposed but broken). The card is now marked unusable there. | BCD note, crbug 41441927 |
| Web Serial: desktop Chromium only | ⚠️ **outdated.** Also Chrome Android 148+ and Firefox 151+ (desktop, add-on prompt). Messages and matrix updated. | BCD, Firefox 151 release notes |
| `getHighEntropyValues()` exists wherever `userAgentData` does | ❌ **was wrong.** Android WebView lacks it; the unguarded call would have hung the appraisal in every Android in-app browser. Guarded now. | BCD `api.NavigatorUAData.getHighEntropyValues` |
| RAM "browser won't report more than this" | ⚠️ Chrome 147+ caps at 32 GB on desktop and 8 GB on Android, rounding down. Wording fixed. | BCD `api.Navigator.deviceMemory` |
| CPU threads are real | ⚠️ Safari clamps to 4 or 8. Now labelled. | BCD note (WebKit bug 233381) |
| GPU name is real | ⚠️ Firefox maps every GPU to a generic bucket (any RTX / GTX → "GeForce GTX 980, or similar"), and Safari always says "Apple GPU". Masked names are labelled and don't drive dGPU guesses. | Firefox `SanitizeRenderer.cpp` |
| Gamepads work on http | ❌ Chrome 86+ and Firefox 81+ return none on insecure origins. The card says so. | Mozilla Hacks "Securing Gamepad API", MDN |
| `Intl.Segmenter` fallback needed below Firefox 125 / Safari 14.1 / Chrome 87 | ✅ | BCD |
| Tailwind v4 needs Chrome 111 / Safari 16.4 / Firefox 128 | ✅ (reason it was removed) | tailwindcss.com/docs/compatibility |
| LINE `?openExternalBrowser=1` opens the real browser | ✅ iOS and Android (a user setting can override it) | Classmethod test write-up |
| Charging can be detected on iOS / Safari some other way | ❌ No web API or reliable trick exists. Hence manual charge. | — |
| Reload re-reads a stale Linux battery | ✅ per Chromium's service lifecycle | Chromium `battery_status_service.cc` |

Sources: [MDN browser-compat-data](https://github.com/mdn/browser-compat-data) · [Firefox 151 for developers](https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/151) · [Brave: Deviations from Chromium](https://github.com/brave/brave-browser/wiki/Deviations-from-Chromium-(features-we-disable-or-remove)) · [Firefox SanitizeRenderer.cpp](https://searchfox.org/mozilla-central/source/dom/canvas/SanitizeRenderer.cpp) · [Chromium battery_status_service.cc](https://github.com/chromium/chromium/blob/main/services/device/battery/battery_status_service.cc) · [Securing Gamepad API](https://hacks.mozilla.org/2020/07/securing-gamepad-api/) · [Tailwind compatibility](https://tailwindcss.com/docs/compatibility) · [LINE openExternalBrowser (Classmethod)](https://dev.classmethod.jp/articles/line-open-uri-in-external-browser/)

## The wired probe (our own device)

`hardware/ileak-probe/ileak-probe.ino` targets any USB-C board with native USB (RP2040, ESP32-S3/C3, SAMD21). Two wires go through a resistor divider into the ADC. It outputs readings two ways at once:

1. **USB CDC serial**: `ILEAK/1 mv=1234\n` at 115200 baud, 10 Hz. `adapters/serial.js` accepts this line or any line that contains a number.
2. **Audio tone** on a pin, AC-coupled into the TRRS mic ring: `freq = 300 + mv/2`. Read by `adapters/audio.js`.

One probe therefore works with desktop browsers, Android, and iPhone.

⚠️ **Real safety:** for demos use a cup of salt water and a 9 V battery. Never put anything into real flood water that might be energized. Breaking the device's warranty is the joke; electrocution is not.

## Native bridge (when the web isn't enough)

Some signals don't reach the browser at all: iOS battery state, Android `ACTION_POWER_CONNECTED`, Android `UsbManager` attach events (these give the exact USB-C device class), iOS `AVAudioSession` route changes, and desktop hot-plug through `rusb`. To get them, wrap the same web build in a thin shell and push events to the page:

```js
window.dispatchEvent(new CustomEvent('ileak:native', {
  detail: { kind: 'power' | 'usb' | 'audio-route', live: true, port: 'USB-C', reading: 220, label: 'Charger attached' },
}))
```

The shell sets `window.ILeakNative` (optionally with `ready()`), and the แอปติดตั้ง card becomes supported. Suggested shells:

| Shell | Platform | Signals |
|---|---|---|
| Capacitor | Android | `ACTION_POWER_CONNECTED/DISCONNECTED`, `UsbManager.ACTION_USB_DEVICE_ATTACHED`, `usb-serial-for-android` |
| Capacitor | iOS | `UIDevice.batteryState`, `AVAudioSession.routeChangeNotification`, `ExternalAccessory` (MFi) |
| Tauri | Win/macOS/Linux | `serialport` + `rusb` hot-plug |

The web app needs no changes for this. The bridge is only another adapter.

## Flow

- **Agreement gate**: shown on every normal load, never remembered. Five separate XP warning dialogs show the facts one at a time. Each has its own 2–4 second reading cooldown and a disabled OK button until zero; pressing OK opens the next warning. The final iLeak consent dialog requires three safety checks plus consent before its large OK button can enter the app. The main page is not rendered until then.
- **Main page**: an elitist, staged reveal. The spec lines type out, the dial needle swings to the brick wattage, and the tier stamp slams down. Peripherals unlock after the stamp. The final number is shown only as `???` until the user holds the button.
- **Calculation overlay**: PS2-boot-style towers with the Balatro-style tally → zoom to black → the level's scene (see "Result scenes") → result sheet. Who takes the case climbs with the level (`game/responders.js`): แม่ → ช่างไฟปากซอย → การไฟฟ้า → ปภ. → ทหารช่าง → UN → NASA + IAEA → เบื้องบน. Lower ones show as "เกินอำนาจ ส่งเรื่องต่อ". Links go to websites only, never real hotlines.

## XP desktop shell

The High app uses an original Luna blue interface for **iLeak: HydroCharging**. `src/index.css` supplies the white window panels, blue title bars, inset fields, orange button hover borders, and green Start/hold controls. The desktop landscape in `public/ui/desktop.svg` is original SVG art. UI text uses Tahoma, with Noto Sans Thai, Sarabun and Leelawadee UI fallbacks; titles prefer Trebuchet MS. Retro scene typography remains separate. The quality screen receives its theme from CSS without changing its router or selection flow.

`components/PortalHeader.jsx` keeps the brand, PS1/PS2 switch and DEV controls. Its ResizeObserver still measures `--header-h`, and z-index 96 keeps DEV reachable above agreement/result overlays. `components/Taskbar.jsx` sits at the bottom at z-index 45, beneath the agreement (50) and calculation (60). Page padding reserves `--taskbar-h`. Covered taskbar controls are disabled/inert while a modal/game is active. น้องปลั๊ก (z 90) stays above everything except the header.

The taskbar contains the original droplet Start emblem, current app button, master sound toggle, and a local clock. `components/StartMenu.jsx` moves the quality selector, quality-screen opener and login into the Start menu. Escape or an outside click closes it. “ปิดเครื่อง…” opens a parody restart dialog; the page reloads only after the user presses “รีสตาร์ท”. The iOS and region blocks remain in place.

`AgreementGate.jsx` uses a sequence of compact XP warning windows, then an iLeak-branded consent window. The Luna frame uses rounded top corners, square bottom corners, a glossy blue caption, beige warning body, original 32 px warning SVG, and centered OK button. Each warning mounts separately, resetting its countdown and playing `exclamation`. Only OK at zero advances. After all five warnings, the final dialog plays `ding`, shows the existing three safety checks and consent, and enables its large OK only when all four are ticked. Its body scrolls independently of the title and final button. DEV remains accessible, with an explicit skip only in DEV mode.

Close/Escape on a warning or final consent opens a second XP error dialog titled **iLeak.exe — READ FIRST**, with an original red error icon and the `critical` cue. `components/agreementMessages.js` contains 12 sharp Thai reminders and a shuffled picker shared across the whole agreement. Every message appears before the pool refills, with no immediate repeat at the refill boundary. The covered warning/consent is inert and hidden from accessibility navigation while the error is open. The error's OK, close button or Escape returns to the same warning/consent and restores focus; it cannot advance the sequence or clear checkbox state. The existing reading timer continues in the background.

The frame was compared with `/home/wxz/42me/ft_blueprint/src/skins/xp.ts` and `src/styles/xp.css`, then checked against [Microsoft's XP dialog screenshot](https://learn.microsoft.com/en-us/windows/win32/uxguide/images/mess-error-image2.png) and the firewall screenshot on page 7 of Microsoft's [XP SP2 developer training](https://download.microsoft.com/download/d/f/8/df8e0222-62d5-470c-8ca5-81662aab1934/SEGURANCA/TreinamentoWindowsXPSP2.pdf). `ft_blueprint` marks its XP skin WIP; it is a secondary reference. Microsoft's general “Using Dialog Boxes” screenshot shows a later theme, so it was not used for the Luna appearance. All rendered artwork and synthesized sounds remain original.

## Replaceable desktop sound scheme

`src/quality/high/sound/scheme.js` tries a drop-in `.mp3`, then `.wav`, then `.ogg` in `public/sounds/`. Missing or undecodable files use original synthesized tones. Audio goes through the existing master gain in `fx/sfx.js`, shared with scene music. Browsers that block autoplay wait for a click/key press; unmounting a dialog cancels its queued sound. Reload after changing audio files, since decoded files/missing-file results are cached for the page session.

| Event | When it plays | Drop-in files, in priority order |
| --- | --- | --- |
| `startup` | Main app opens after agreement or DEV skip | `xp-startup.mp3`, `.wav`, `.ogg` |
| `exclamation` | Each of the five agreement warnings opens | `xp-exclamation.mp3`, `.wav`, `.ogg` |
| `critical` | iOS/region block, or attempted close of required agreement | `xp-critical.mp3`, `.wav`, `.ogg` |
| `ding` | Final consent dialog, login information or helper action | `xp-ding.mp3`, `.wav`, `.ogg` |
| `notify` | Visible helper speaks | `xp-notify.mp3`, `.wav`, `.ogg` |
| `deviceConnect` | A probe/device card becomes live | `xp-device-connect.mp3`, `.wav`, `.ogg` |
| `deviceDisconnect` | A live probe/device disconnects | `xp-device-disconnect.mp3`, `.wav`, `.ogg` |
| `start` | Start menu opens | `xp-start.mp3`, `.wav`, `.ogg` |
| `shutdown` | User confirms the restart parody | `xp-shutdown.mp3`, `.wav`, `.ogg` |

For example, add `public/sounds/xp-notify.wav` to replace the helper cue. No Windows audio, logos, cursors or font files are bundled. `public/sounds/README.md` repeats the file map for convenience.

## XP interface gags

- `components/HardwareBalloon.jsx` observes existing probe-card live-state transitions in the High app. It shows the device name in a Found New Hardware balloon, or a disconnection balloon, with the matching sound. It dismisses after five seconds or with its close button and hides behind an open Start menu. Probe detection is unchanged.
- **น้องปลั๊ก**, the companion, is described in its own section below.
- The loading overlay uses an original SVG hourglass cursor with a `wait` fallback.
- `fx/Certificate.jsx` renders a Certificate of Authenticity sticker with CSS guilloche patterns, a hologram strip, the tier as an edition, and a deterministic fake product key derived from `cert.id`. The root remains `.cert`. Printing hides the desktop, scene and result controls, removes L7 transforms/masks and height clipping, and prints only the certificate.

## น้องปลั๊ก, the companion (`quality/high/companion/`, `server/companion.js`)

A girl whose twin tails end in plugs. She lives in the bottom-right corner, above the taskbar, on every High-quality screen (during the full-screen result overlay, which hides the taskbar, she drops to the screen's bottom edge): the agreement, the block screens, the main page and the result scenes. She makes one short, politely savage remark in casual Thai about most of what the user does. She calls herself ฉัน and the user เธอ, นาย or แก. She is often helpful first, then stabs the user in the back.

- **Portraits:** `public/companion/*.webp`, 18 expressions at 192 px, sliced from `art/companion-sheet.jpg`. The face ids and what they show are listed in `FACES` in `server/companion.js`.
- **Frame (`Companion.jsx`, `companion.css`):** a small XP Messenger-style window with a Luna title bar, a glossy portrait frame and a status dot. MSN notification bubbles slide up above her window, headed "น้องปลั๊ก says:" with one message per phrase, "กำลังพิมพ์…" between them and an original two-note chime on each. Bubbles persist until clicked; actual message sends less than 10 s apart join the latest bubble, otherwise they start a new one. Outside L7, at most three bubbles remain; a fourth displaces the oldest. Each body scrolls internally and follows incoming messages, with the stack constrained to the viewport. Clicking a bubble or its keyboard-accessible close button dismisses only that bubble; if it is her active bubble, it also stops the current voice and drops the rest of the line and queued speech. Completed notifications remain when she is interrupted or poked. Minimising her (remembered in `localStorage`) leaves a round orb with the same notification history. Clicking her portrait cuts her off, and she then complains about it. She hops up while the Found New Hardware balloon is showing. Notification history lasts for the page session only.
- **Triggers (`brain.js` → `nudge(event, detail, priority)`):**
  - priority 2 (always comments; newest wins while she is talking): hello, gate, blocked, tier stamp, each scene, result, Start menu help, poke, and the L7 events;
  - priority 1 (comments unless she is mid-sentence): agree, manual power answer, peripheral tap, hold, calc, certificate, idle for 45 s, return to the tab;
  - priority 0 (only sometimes, at least 7 s apart): any click anywhere. Clicks are caught in the capture phase with the control's label.
- **Brain and voice:** `/api/companion/say` asks DeepSeek (OpenAI-compatible, JSON mode) for `{mode, text, face}`. It receives the filled-in prewritten lines for the moment (`candidates()` in `lines.js`) and a randomly suggested mode: `builtin` 25% (say one as written), `extend` 25%, `shorten` 20%, or `own` 30% (a fresh line). The dev server logs each line with its mode. Paxa reads a whole line in one breath, so `phrases()` in `brain.js` splits the line at its spaces (Thai's phrase breaks). A fragment too short to say alone, or written in Latin letters (`SS`, `PS2`), stays with its neighbour. Each phrase is sent to `/api/companion/tts` (Paxa `POST /v1/tts`, voice `bualoi`, model `paxa-tts-flash-v1`); all phrases are synthesised at once and played in turn with a 0.3 s pause. The audio plays through the shared master gain, so the taskbar mute silences her too. With no voice, each phrase stays up for its reading time.
- **Demo API:** `functions/companion.js` is shared by the Firebase `companion` HTTP function and the Vite middleware. Firebase loads `functions/.env`; Vite loads it too, with root `.env.local` as a local override. The throwaway demo credentials in `functions/.env` are committed at the user's explicit request. They are server environment variables and are not embedded in frontend assets. Hosting rewrites `/api/companion/**` before the SPA fallback; both Firebase configs include that route. The function runs in `asia-southeast1` with at most one instance. It accepts Firebase's already-parsed request bodies and Vite's streamed bodies. DeepSeek thinking is disabled for these short remarks, with a 400-token JSON output allowance.
- **Surroundings:** `surroundings.js` supplies the current calculation phase, scene/level/verdict/voltage, result-card motion, and her separate window's flight/visibility with every accepted event. DeepSeek treats these as authoritative over old remarks and builtins. Generic setup/click/idle chatter is suppressed during results; tab-return, poke, certificate and L7 reactions have context-specific fallback banks. Scene changes/exit/tab hiding cancel outdated speech and replies. She can keep shouting while her L7 window disappears inside the hole; delayed drafts are refreshed if she has already emerged before delivery. The result card disappearing does not imply that her independent window disappeared. Recent model history contains delivered phrases only. See [the implementation and checks](handoff/2026-10-11-companion-surroundings.md).
- **Deployed site:** deploying `functions:companion,hosting` enables DeepSeek remarks and Paxa voice. Hosts without that backend use the prewritten lines without voice. Leaving the High tree stops playing speech and cancels delayed delivery while retaining completed desktop notifications.
- **L7 (`companion/debris.js`):** her entire Messenger window floats independently of the result card. It and existing desktop notifications spiral into the hole, disappear briefly and emerge into their own ellipses. A new MSN bubble stays at the corner while she talks; after the last phrase's voice/reading time, it detaches and follows the same pull/disappear/spit sequence. Every finished line becomes a separate immutable floating bubble, allowing the pile to grow beyond the desktop's three-bubble limit (up to 32; a longer session displaces the oldest debris). One animation loop gives each object a distinct phase, speed, spin and scale, using the scene's shared hole framing and masking the far-side UI over its shadow. Drag a floating title bar to fling it; hovering, clicking or focusing never stops or enlarges it. The window remains live: portrait poke, minimise/orb and bubble dismissal work. Dismissing the active bubble stops speech and prevents it from becoming debris. Existing desktop history is retained separately; closing L7 drops its debris and pending speech, restores the normal dock and then reacts to being released. Reduced motion presents a static scrolling collection; printing hides it. `orbit.js` still emits result-card fling/swallow/spit remarks, with context distinguishing that card from her own window.
