# 🤡 Stupid ShitX: iLeak — ตรวจไฟรั่วในน้ำท่วมผ่านสาย USB-C

## 💡 The Problem Nobody Had

Thailand is flooding again, and nobody knows whether the water around them is live. The answer: dip one end of a cable into the flood, plug the other end into your phone, and see whether it "charges".

## 🚨 Features & Key Inefficiencies

- Every wired port counts as a probe (USB-C is best): Web Serial, battery charging, WebUSB, WebHID, 3.5mm / USB-C audio, gamepad, DisplayPort alt-mode, OTG mouse, Ethernet, a native-app bridge, and a Placebo button.
- Before anything else you must read every fact (each one has a countdown) and sign the agreement. Every single time.
- The app judges your device first: it reads the specs, guesses the wattage of your power brick, and gives you a tier from F through S (280 W) all the way up to GW, Kardashev II and Ω. The tier becomes mult₁.
- Each peripheral you plug in raises mult₂. Hold to dip, and it scores like a Balatro hand: chips, +Mult, ×Mult, each with its own sound.
- The result cuts to a scene picked by how much power you have: from an 8-bit underwater stage (nothing powered, safe), through an XP blue screen, heaven, a thunderstorm, an electrocuted skeleton (FAHHH), a GBA-style battle, and a ภัยพิบัติระดับหมอลำ military alert, up to a ray-traced Gargantua black hole.
- Our own wired probe board, which reports over USB serial and also as an audio tone, so it works on iPhone too.
- A briefing page to read before you dip, a certificate that voids your warranty, and an emergency button that plays a funeral chant.

Do not put electronics in real flood water.

## 🏗️ Tech Stack

React + Vite + Tailwind, WebGL, WebAudio, and Web Serial/USB/HID. Details are in [ARCHITECTURE.md](ARCHITECTURE.md), and the probe firmware is in [hardware/ileak-probe](hardware/ileak-probe/ileak-probe.ino).

Agent work logs and continuation notes are in [handoff/README.md](handoff/README.md).

```sh
pnpm install
pnpm dev          # http://localhost:5173
pnpm dev --host   # phones: mic/serial need HTTPS outside localhost
```

Tick **DEV** (top right) for the dev panel: skip the agreement and other screens, set any wattage or tier, fire any FX level, and run stress tests. To add a port, write one file in `src/probes/adapters/` and add it to `src/probes/index.js`.

## Firebase demo deployment

Run these on the deployment machine with Node 22.12 or newer (Node 22 recommended):

```sh
git pull --ff-only
npm ci
npm test
npm run lint
npx firebase-tools login
make deploy
```

`make deploy` runs `npm run build` and deploys only Hosting to `ileak-test`, using `.firebaserc`. This works on Firebase's free Spark plan without Cloud Functions, Cloud Build or Artifact Registry. The demo build embeds the explicitly approved throwaway DeepSeek and Paxa credentials from `functions/.env` and calls those providers directly from the browser. Root `.env.local` can override the demo defaults.

After deployment, open High quality, click the page to unlock audio, enable sound and poke น้องปลั๊ก. Her reply should come from DeepSeek and be spoken by Paxa. This build does not use `/api/companion`; provider failures fall back to prewritten dialogue. The browser's region gate remains active.

If a project later enables Blaze, `make deploy-blaze` installs the function dependencies, runs `npm run build:backend` and deploys the companion API, server-side region gate and Hosting through `firebase.blaze.json`. That build keeps credentials in the backend. Local `npm run dev` also uses the existing proxy.

## 🕹️ Demo & Screenshots

## 🤝 Team
