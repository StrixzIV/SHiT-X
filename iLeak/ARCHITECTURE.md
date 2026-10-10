# iLeak architecture

> Detect electricity in flood water by dipping one end of a cable in it and plugging the other end into your device. USB-C works best, but any wired port counts.

The first version (agy/Gemini) did all detection through one browser API, `navigator.getBattery()`, with a manual toggle as the fallback. That API exists only in Chromium. On iPhone, Safari and Firefox the app could do nothing except fake it. This version treats *every wired interface a device exposes* as a possible probe and scores them together.

## Layers

```
┌────────────────────────────────────────────────────────────────────┐
│  UI (React)                                                        │
│   ProbePage (main) ─ JokerCard × N ─ ScorePanel ─ CashOut          │
│   BriefingPage (old stages 1 + 2)                                  │
│   fx/: SwirlBackground (WebGL), sfx (WebAudio), juice (CSS)        │
├────────────────────────────────────────────────────────────────────┤
│  game/score.js — pure: cards → steps[] + { chips, mult, total }    │
├────────────────────────────────────────────────────────────────────┤
│  probes/useProbes.js — owns adapter lifecycle, merges state        │
├────────────────────────────────────────────────────────────────────┤
│  probes/adapters/* — one file per wired interface                  │
│   serial · battery · webusb · webhid · audio · gamepad ·           │
│   display · otg · ethernet · native · placebo                      │
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

### Scoring (`game/score.js`)

Balatro rules: hand base chips/mult come from the number of live probes (High Card = plain water … *Flush 🚽* = 5+ cables). Then, in hand order, each live card adds its `reading` to chips and applies `+mult` or `×mult`. Total volts = chips × mult. If the total reaches **220 V** (Thai mains, the "Boss Blind"), the result is a leak. Signing the consent form on the briefing page gives a +1 Mult voucher.

The function is pure and returns the step list, so the UI can animate it one step at a time.

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

## Pages

- **`#/` เช็คไฟรั่ว (main)**: Balatro table. The WebGL swirl background changes mood (calm water → purple when a cable is live → red/orange on a leak). It also has CRT scanlines, floating and tilting holographic joker cards, chip/mult pop-ups, screen shake, a score that catches fire, and a pentatonic tally chime.
- **`#/briefing` อ่านก่อนจุ่ม**: old stages 1 + 2 merged into one page in serious university-portal style. It's written to be read top to bottom until you realize how dumb it is. Ends with a real safety line (PEA 1129 / MEA 1130).
- **Cash out (modal)**: old stage 4. Shows the result, Shopee electrical tape, the funeral chant, and the certificate.
