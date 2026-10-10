# iLeak architecture

> Detect electricity in flood water by dipping one end of a cable in it and plugging the other end into your device. USB-C works best, but any wired port counts.

The first version (agy/Gemini) did all detection through one browser API, `navigator.getBattery()`, with a manual toggle as the fallback. That API exists only in Chromium. On iPhone, Safari and Firefox the app could do nothing except fake it. This version treats *every wired interface a device exposes* as a possible probe and scores them together.

## Layers

```
┌────────────────────────────────────────────────────────────────────┐
│  AgreementGate (every load) → MainPage                             │
│   1 Appraisal: spec readout → wattage dial → tier stamp (mult₁)    │
│   2 Peripherals: tap to connect, each live one raises mult₂        │
│   3 HoldButton → CalcOverlay: fake compute → tally → level FX      │
│  fx/: SwirlBackground (WebGL) · Chaos · sfx (WebAudio) · juice     │
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

- GPU name from `WEBGL_debug_renderer_info` (RTX xx80/90 Laptop → 280 W, desktop RTX → PSU 650–1000 W, Apple M Max → 140 W, iGPU → 65 W, flagship Adreno → 45 W, …)
- CPU threads (≥ 24 → 280 W "HX class", ≥ 16 → 140 W). Hybrid-graphics laptops often show the iGPU to the browser, so this catches them.
- a live reading from `battery.chargingTime` when charging (assumed 80 Wh laptop / 17 Wh phone)
- the user can override the wattage; it is labelled "self-declared"

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

total = chips × mult. The FX level comes from the total:

| Level | Total | Effects |
|---|---|---|
| 0 | 0 | calm water, bubbles, soft chime |
| 1 | > 0 | shake, sparks |
| 2 | ≥ 2,000 | red swirl, flames, boom |
| 3 | ≥ 8,000 | lightning, white flashes, RGB glitch, hue cycling |
| 4 | ≥ 30,000 | emoji rain, wobble |
| 5 | ≥ 100,000 | fake BSOD + siren, spin |
| 6 | ≥ 1e8 | nuke flash, strobing invert, emergency news ticker |
| 7 | ≥ 1e15 | the universe gets sucked into a black hole, then a big bang |

## Dev mode

Open with **`?dev`** (e.g. `http://localhost:5173/?dev`). It skips the agreement and the appraisal animation, makes the hold button 0.3 s, and shows a panel (bottom-left, collapsible) where you can:

- set any wattage (`280`, `1.21e9`, `1e42`) or jump to any tier
- force power on / off / auto
- add fake USB-C peripherals (+2 mult each)
- set animation speed to 1× / 3× / 10×
- fire the real score, or fire any FX level L0–L7 directly
- replay the appraisal animation, or reopen the agreement

## Device support matrix

Cards sit in hand order. USB-C cards come first and carry the biggest multipliers, because USB-C is the main supported port.

| Card | Port | API | Chrome/Edge desktop | Android Chrome | iOS/iPadOS Safari | Firefox |
|---|---|---|---|---|---|---|
| iLeak Probe | USB-C | Web Serial | ✅ | ⚠️ recent Chrome only | ❌ → use audio | ❌ |
| Battery Joker | USB-C | Battery Status | ✅ | ✅ | ❌ → native shell | ❌ |
| Raw USB Joker | USB-C | WebUSB | ✅ | ✅ | ❌ | ❌ |
| HID Joker | USB-C | WebHID | ✅ | ❌ | ❌ | ❌ |
| Jack Joker | 3.5mm / USB-C audio | getUserMedia + analyser | ✅ | ✅ | ✅ | ✅ |
| Analog Joker | USB-C | Gamepad | ✅ | ✅ | ✅ | ✅ |
| Alt-Mode Joker | USB-C (DP/HDMI) | `screen.isExtended` | ✅ | ❌ | ❌ | ❌ |
| OTG Joker | USB-C | `any-pointer: fine` media query | n/a | ✅ | ✅ (iPad) | ✅ |
| LAN Joker | Ethernet | `navigator.connection.type` | ❌ | ✅ | ❌ | ❌ |
| Native Joker | any | native bridge | via Tauri | via Capacitor | via Capacitor | — |
| Placebo Joker | ใจ (heart) | none | ✅ | ✅ | ✅ | ✅ |

**Audio is the universal fallback.** Every phone has a mic input, either a 3.5mm TRRS jack or a USB-C/Lightning audio dongle. The Jack Joker:
- counts any *wired* input it detects by label (`USB`, `headset`, `wired`, …) as live, and
- detects a tone from the iLeak Probe (frequency ∝ mV). This makes it a one-way wired modem that works on iOS, where Web Serial and WebUSB don't exist.

Mic access requires HTTPS, so for phone demos use `vite --host` behind HTTPS or deploy the app.

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

The shell sets `window.ILeakNative` (optionally with `ready()`), and the Native Joker becomes supported. Suggested shells:

| Shell | Platform | Signals |
|---|---|---|
| Capacitor | Android | `ACTION_POWER_CONNECTED/DISCONNECTED`, `UsbManager.ACTION_USB_DEVICE_ATTACHED`, `usb-serial-for-android` |
| Capacitor | iOS | `UIDevice.batteryState`, `AVAudioSession.routeChangeNotification`, `ExternalAccessory` (MFi) |
| Tauri | Win/macOS/Linux | `serialport` + `rusb` hot-plug |

The web app needs no changes for this. The bridge is only another adapter.

## Flow

- **Agreement gate**: shown on every load, never remembered. Facts unlock one at a time, and each "read" button counts down by text length. After that, every safety box and the consent must be ticked. The main page is not rendered until then.
- **Main page**: an elitist, staged reveal. The spec lines type out, the dial needle swings to the brick wattage, and the tier stamp slams down. Peripherals unlock after the stamp. The final number is shown only as `???` until the user holds the button.
- **Calculation overlay**: the scoring cards trigger one by one (chips / +Mult / ×Mult / ×0, with pop-ups and sounds whose pitch climbs) → the total ticks up → level FX → result sheet with Shopee tape, funeral chant and certificate.
