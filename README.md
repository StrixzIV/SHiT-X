# 🤡 Stupid ShitX: iLeak — ตรวจไฟรั่วในน้ำท่วมผ่านสาย USB-C

## 💡 The Problem Nobody Had

Thailand is flooding again, and nobody knows whether the water around them is live. The answer: dip one end of a cable into the flood, plug the other end into your phone, and see whether it "charges".

## 🚨 Features & Key Inefficiencies

- Every wired port counts as a probe (USB-C is best): Web Serial, battery charging, WebUSB, WebHID, 3.5mm / USB-C audio, gamepad, DisplayPort alt-mode, OTG mouse, Ethernet, a native-app bridge, and a Placebo button.
- Readings are scored like Balatro (chips × mult). Beat the 220 V Boss Blind and you've found a leak.
- Swirling pixel-paint background, holographic joker cards, screen shake, and a score that catches fire.
- Our own wired probe board, which reports over USB serial and also as an audio tone, so it works on iPhone too.
- A briefing page to read before you dip, a certificate that voids your warranty, and an emergency button that plays a funeral chant.

Do not put electronics in real flood water.

## 🏗️ Tech Stack

React + Vite + Tailwind, WebGL, WebAudio, and Web Serial/USB/HID. Details are in [ARCHITECTURE.md](ARCHITECTURE.md), and the probe firmware is in [hardware/ileak-probe](hardware/ileak-probe/ileak-probe.ino).

```sh
pnpm install
pnpm dev          # http://localhost:5173
pnpm dev --host   # phones: mic/serial need HTTPS outside localhost
```

To add a port, write one file in `src/probes/adapters/` and add it to `src/probes/index.js`.

## 🕹️ Demo & Screenshots

## 🤝 Team
