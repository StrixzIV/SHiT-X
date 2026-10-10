# iLeak — ตรวจไฟรั่วในน้ำท่วมผ่านสาย USB-C

Dip one end of a cable in the flood, plug the other end into your device, then play the hand. Any wired port counts as a probe (USB-C is best), and each probe's reading is scored Balatro-style. Beat 220 V and you have a leak.

```sh
pnpm install
pnpm dev          # http://localhost:5173
pnpm dev --host   # phones: mic/serial need HTTPS outside localhost
```

- Architecture, device matrix, native bridge: [ARCHITECTURE.md](ARCHITECTURE.md)
- Our own wired probe firmware: [hardware/ileak-probe](hardware/ileak-probe/ileak-probe.ino)
- Add a port: write one file in `src/probes/adapters/`, register it in `src/probes/index.js`

Satire for The Stupid Hackathon Thailand X. Do not put electronics in real flood water.
