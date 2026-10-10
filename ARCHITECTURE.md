# iLeak architecture

> Detect electricity in flood water by dipping one end of a cable in it and plugging the other end into your device. USB-C works best, but any wired port counts.

The first version (agy/Gemini) did all detection through one browser API, `navigator.getBattery()`, with a manual toggle as the fallback. That API exists only in Chromium. On iPhone, Safari and Firefox the app could do nothing except fake it. This version treats *every wired interface a device exposes* as a possible probe and scores them together.

## Layers

```
┌────────────────────────────────────────────────────────────────────┐
│  AgreementGate (every load) → MainPage                             │
│   1 Appraisal: spec readout → wattage dial → tier stamp (mult₁)    │
│   2 Peripherals: tap to connect, each live one raises mult₂        │
│   3 HoldButton → CalcOverlay: tally on black → scene L0–L7 → sheet │
│  fx/: Particles · scenes/L0–L7 · audio + sfx (WebAudio) · juice   │
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

1. **Loading:** a black page with white motes drifting slowly around the centre (`fx/Particles.jsx`). On top, the Balatro-style tally plays (chips / +Mult / ×Mult / ×0, with sounds), then the total ticks up.
2. **Hard cut** to the level's scene. Each scene opens its own sound session (`fx/audio.js`), which stops with the scene.
3. **Result sheet** slides up over the still-running scene after `SCENE_MS[level]`.

| Lvl | Scene | Sound (synthesized, original) | Drop-in files (`public/fx/`) |
|---|---|---|---|
| 0 | Famicom-style underwater stage, 240 px tall and as wide as the screen (portrait phones get a taller water column): phone diver trailing its cable, fish, jellyfish, coral, HUD, and Claude Code's mascot (block-for-block from its welcome banner) in a hard hat, paddling across and saying "BUILDING iLEAK..." | 3/4 chiptune waltz, bubble blips, a bloop when Claude speaks | `l0-underwater.mp3` |
| 1 | XP-style blue screen (own wording) with sparks and a little smoke | 8-bit crackle + mains hum | — |
| 2 | Hard cut to the heaven stairway photo, slow zoom, god-rays, sparkles | angel choir "ahh" chords + harp glissando, generated reverb | `l2-heaven.mp3` (photo: `heaven.jpg`) |
| 3 | Storm and rain; the background figure only shows when lightning strikes | crack + rumble per strike, rain bed | `lowtiergod.png` / `.jpg` / `.webp`: a transparent cut-out stands full-height on the ground, a plain photo fills the screen (else a silhouette) |
| 4 | The purple electrocuted skeleton photo, shaking, X-ray flicker, purple arcs | electric buzz + synthesized "FAHHH" | `l4-fahh.mp3`, `fahh.mp3` or `fahhhhhhhhhhhhhh.mp3`, played at the cut and ~2.6 s later (photo: `skeleton.png`) |
| 5 | GBA-style wild battle: flash + stripe wipe, then PLUGCHU (original electric plug creature). You use THUNDER, it's not very effective, it absorbs 220 V, it uses THUNDER, you faint | encounter jingle, battle loop with drums, attack / HP-drain / faint effects, text blips | `l5-battle.mp3`, `l5-opponent.png` / `.jpg` / `.webp` (rename via `OPPONENT` in `L5Battle.jsx`) |
| 6 | "ภัยพิบัติระดับหมอลำ": military command display: radar sweep, alarm title, warning stripes, radio log with the live voltage | radio static, squelch, roger beeps, Morse, distant siren; a Thai voice reads the log if the device has one | `l6-radio.mp3` |
| 7 | Gargantua: WebGL ray-marched black hole, rays bent by the Schwarzschild photon equation (lensed disk, photon ring, Doppler-bright side), orbiting camera | heavy distorted drone: detuned saws through a resonant swept filter and overdrive, sub, whooshes, slow downward pitch bend | `l7-space.mp3` |

**Drop-in files** are optional. Each scene tries its file first and falls back to its own synthesized sound or art when the file is missing. On Firebase a missing path returns `index.html`, which just fails to load. The app ships original art and music only. Nintendo / Pokémon assets, a real person's photo, or a meme clip are the team's own files to add.

Mute (the header speaker) silences everything, including scenes already playing, through one master gain (`fx/sfx.js`).

## Dev mode

The **DEV tickbox** sits in the top-right of the header and is always visible. `?dev` in the URL does the same, and ticking the box writes `?dev=1` so it survives reloads. Ticking it opens a panel under the box (▾ / ▴ folds it). The whole header sits above every overlay (agreement, calculation, blue screen, black hole), so the tickbox and panel are reachable everywhere. Overlays read the header's measured height from `--header-h` and start below it. Nothing dev-related applies while the box is unticked.

- **ข้าม (skips, each toggleable live):** agreement page · iOS block · appraisal animation · forced manual charge · calculation (straight to the result with its effects) · 0.3 s hold
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

- **Agreement gate**: shown on every load, never remembered. Facts unlock one at a time, and each "read" button counts down by text length. After that, every safety box and the consent must be ticked. The main page is not rendered until then.
- **Main page**: an elitist, staged reveal. The spec lines type out, the dial needle swings to the brick wattage, and the tier stamp slams down. Peripherals unlock after the stamp. The final number is shown only as `???` until the user holds the button.
- **Calculation overlay**: black loading screen with floating motes and the Balatro-style tally → hard cut to the level's scene (see "Result scenes") → result sheet. Who takes the case climbs with the level (`game/responders.js`): แม่ → ช่างไฟปากซอย → การไฟฟ้า → ปภ. → ทหารช่าง → UN → NASA + IAEA → เบื้องบน. Lower ones show as "เกินอำนาจ ส่งเรื่องต่อ". Links go to websites only, never real hotlines.
