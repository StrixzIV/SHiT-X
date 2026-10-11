import { useEffect } from 'react'
import { drive, noise, playFile, session, tone, voice } from '../audio.js'
import { geo, mix, rgb } from '../gl/mesh.js'
import { chain, move, turnX } from '../gl/m4.js'
import { useRetroGL } from '../gl/useRetroGL.js'
import { rand } from './useCanvas.js'

// Level 4 — low-poly: someone knee-deep in the flood, phone in hand, cable in the
// water, getting electrocuted. Flickers body → X-ray skeleton → white-out, arcs
// crawl over them, and the jaw drops on each FAHHH.
// Drop the real clip in public/fx/ (any of FAHH_FILES); otherwise it's synthesized.
const FAHH_FILES = ['l4-fahh.mp3', 'fahh.mp3', 'fahhhhhhhhhhhhhh.mp3']
// The clip plays at this volume (1 = as recorded). Meme clips are mastered very
// hot; lower this if the FAHH still drowns out everything else.
const FAHH_GAIN = 0.35
const FAHH_AT = [0, 2.6]
function fahh(s, at = 0) {
  noise(s, { at, dur: 0.16, gain: 0.2, type: 'highpass', freq: 2400 }) // "F"
  const yell = drive(s, 5)
  voice(s, { freq: 210, slideTo: 150, at: at + 0.12, dur: 1.35, gain: 0.13, attack: 0.04, vibrato: 7, formants: [760, 1220, 2650], dest: yell })
}

const SKIN = rgb('#e0ac69')
const SHIRT = rgb('#2f7df6')
const PANTS = rgb('#1f2937')
const BONE = rgb('#f5f0e1')
const VOID = rgb('#160428')
const JAW = [0, 1.31, 0.02] // hinge

function body() {
  const g = geo()
  for (const x of [-0.13, 0.13]) g.box({ x, y: -0.5, z: 0, w: 0.2, h: 0.92, d: 0.22, col: PANTS })
  g.box({ x: 0, y: 0.4, z: 0, w: 0.56, h: 0.76, d: 0.3, col: SHIRT })
  g.box({ x: 0, y: 1.16, z: 0, w: 0.12, h: 0.06, d: 0.12, col: SKIN })
  g.box({ x: 0, y: 1.21, z: 0, w: 0.32, h: 0.36, d: 0.32, col: SKIN })
  g.box({ x: 0, y: 1.52, z: -0.02, w: 0.34, h: 0.08, d: 0.34, col: rgb('#2b1d14') })
  // left arm down, right arm up holding the phone
  g.beam([-0.33, 1.12, 0], [-0.36, 0.45, 0.02], 0.13, SHIRT)
  g.beam([0.33, 1.12, 0], [0.55, 1.36, 0.05], 0.13, SHIRT)
  g.beam([0.55, 1.36, 0.05], [0.47, 1.62, 0.12], 0.11, SKIN)
  g.box({ x: 0.46, y: 1.58, z: 0.16, w: 0.09, h: 0.17, d: 0.03, col: rgb('#111111') })
  // the USB-C cable down into the water
  const cable = [[0.46, 1.58, 0.17], [0.7, 1.2, 0.25], [0.84, 0.6, 0.3], [0.9, 0.1, 0.32], [0.92, -0.3, 0.33]]
  for (let i = 0; i + 1 < cable.length; i++) g.beam(cable[i], cable[i + 1], 0.03, rgb('#e8e8e8'))
  return g.data
}

function skeleton() {
  const g = geo()
  g.ball({ x: 0, y: 1.42, z: 0, r: 0.16, rings: 4, sides: 7, col: BONE })
  for (const x of [-0.06, 0.06]) g.box({ x, y: 1.4, z: 0.13, w: 0.07, h: 0.07, d: 0.05, col: rgb('#1a0b2e') })
  for (let i = 0; i < 10; i++) g.box({ x: 0, y: 0.52 + i * 0.07, z: -0.03, w: 0.05, h: 0.045, d: 0.05, col: BONE })
  // ribs: from the spine round to the front, both sides
  for (let i = 0; i < 5; i++) {
    const y = 1.1 - i * 0.065
    for (const s of [-1, 1]) {
      const a = [0, y, -0.03]
      const b = [s * 0.21, y - 0.03, 0.02]
      const c = [s * 0.11, y - 0.07, 0.13]
      g.beam(a, b, 0.025, BONE)
      g.beam(b, c, 0.025, BONE)
    }
  }
  g.box({ x: 0, y: 0.82, z: 0.13, w: 0.05, h: 0.26, d: 0.03, col: BONE })
  for (const s of [-1, 1]) g.beam([0, 1.16, -0.01], [s * 0.3, 1.14, 0], 0.03, BONE)
  g.box({ x: 0, y: 0.38, z: 0, w: 0.36, h: 0.13, d: 0.17, col: BONE })
  for (const s of [-1, 1]) {
    g.beam([s * 0.12, 0.4, 0], [s * 0.13, -0.05, 0.01], 0.05, BONE)
    g.ball({ x: s * 0.13, y: -0.05, z: 0.01, r: 0.045, rings: 3, sides: 5, col: BONE })
    g.beam([s * 0.13, -0.05, 0.01], [s * 0.13, -0.48, 0], 0.045, BONE)
  }
  g.beam([-0.3, 1.14, 0], [-0.34, 0.8, 0.01], 0.045, BONE)
  g.beam([-0.34, 0.8, 0.01], [-0.36, 0.47, 0.02], 0.04, BONE)
  g.beam([0.3, 1.14, 0], [0.55, 1.36, 0.05], 0.045, BONE)
  g.beam([0.55, 1.36, 0.05], [0.47, 1.6, 0.12], 0.04, BONE)
  return g.data
}

// a few zigzag arcs crawling over the body and down the cable, new every frame
function arcs(frame) {
  const g = geo()
  for (let k = 0; k < 6; k++) {
    if (rand(frame, k) < 0.35) continue
    let p = k < 2 ? [0.9, 0.1 + rand(frame, k + 9) * 1.2, 0.3] : [(rand(frame, k + 1) - 0.5) * 0.8, rand(frame, k + 2) * 1.6 - 0.3, 0.2]
    for (let i = 0; i < 6; i++) {
      const q = [p[0] + (rand(frame * 7 + k, i) - 0.5) * 0.35, p[1] + (rand(frame * 7 + k, i + 9) - 0.5) * 0.35, p[2] + (rand(frame * 7 + k, i + 19) - 0.3) * 0.15]
      g.beam(p, q, 0.025, [0.85, 0.6, 1])
      p = q
    }
  }
  return g.data
}

export default function L4Skeleton({ speed = 1 }) {
  useEffect(() => {
    const s = session(0.9)
    if (!s) return
    // electric buzz underneath
    const buzz = drive(s, 4)
    tone(s, { freq: 55, type: 'sawtooth', dur: 30, gain: 0.05, attack: 0.05, dest: buzz })
    tone(s, { freq: 110, type: 'square', dur: 30, gain: 0.025, attack: 0.05, dest: buzz })
    s.every(() => noise(s, { dur: 0.05, gain: 0.08, type: 'bandpass', freq: 3000 + Math.random() * 3000, q: 3 }), 140)
    // FAHH twice: at the cut and again ~2.6 s in (the real clip if present).
    playFile(s, FAHH_FILES, { gain: FAHH_GAIN }).then((ok) => {
      if (!s.alive) return
      if (ok) return s.later(() => playFile(s, FAHH_FILES, { gain: FAHH_GAIN }), (FAHH_AT[1] * 1000) / speed)
      fahh(s)
      s.later(() => fahh(s), (FAHH_AT[1] * 1000) / speed)
    })
    return () => s.stop()
  }, [speed])

  const ref = useRetroGL((r) => {
    const person = r.mesh(body())
    const bones = r.mesh(skeleton())
    const jaw = r.mesh(geo().box({ x: 0, y: -0.07, z: 0.05, w: 0.2, h: 0.07, d: 0.15, col: BONE }).data)
    const water = r.mesh([], true)
    const zap = r.mesh([], true)
    return (t) => {
      const ts = t * speed
      const frame = Math.floor(t * 30)
      // 0, 2: body under a flickering light · 1: X-ray · 3: white-out
      const state = Math.floor(t * 7.5) % 4
      const j = (k) => (rand(frame, k) - 0.5) * 0.06
      const fig = move(j(1), j(2) * 0.5, j(3))
      const fahhing = FAHH_AT.some((at) => ts >= at && ts < at + 1.3)
      const jawM = chain(fig, move(...JAW), turnX(fahhing ? 0.55 + Math.sin(t * 40) * 0.08 : 0.05))
      const xray = state === 1
      const white = state === 3
      const bg = white ? [0.95, 0.88, 1] : xray ? rgb('#5b21b6') : VOID
      const a = 0.4 + Math.sin(t * 0.5) * 0.35
      const eye = [Math.sin(a) * 3.2 + j(4), 1.1 + j(5), Math.cos(a) * 3.2]
      r.begin({ eye, at: [0, 0.9, 0], fov: 52, far: 40 }, {
        clear: bg, fog: bg, fogNear: 4, fogFar: 14,
        light: [-0.4, -0.6, -0.7], lightCol: rand(frame, 7) < 0.3 ? [1.4, 1.2, 1.6] : [0.7, 0.55, 0.9], ambient: [0.35, 0.22, 0.45],
        bloom: 1.1, glowFrom: 0.62,
      })
      water.update(geo().field({ x: 0, z: 0, w: 14, d: 14, n: 20, fn: (x, z) => 0.03 * Math.sin(x * 3 + t * 6) + 0.03 * Math.sin(z * 2.6 - t * 5), col: () => mix(rgb('#1b1240'), rgb('#3b2a80'), xray ? 1 : 0) }).data)
      if (white) {
        r.draw(person, fig, { lit: false, tint: [0.05, 0.02, 0.08] })
      } else if (xray) {
        r.draw(person, fig, { lit: false, blend: 'add', alpha: 0.12, tint: [0.6, 0.4, 1] })
        r.draw(bones, fig, { lit: false })
        r.draw(jaw, jawM, { lit: false })
      } else {
        r.draw(person, fig)
      }
      r.draw(water, undefined, { blend: 'alpha', alpha: 0.85 })
      zap.update(arcs(frame))
      r.draw(zap, fig, { lit: false, blend: 'add' })
      r.end()
    }
  })

  return (
    <div className="scene">
      <canvas ref={ref} className="scene-canvas retro" aria-label="โครงกระดูกโดนไฟช็อต" />
    </div>
  )
}
