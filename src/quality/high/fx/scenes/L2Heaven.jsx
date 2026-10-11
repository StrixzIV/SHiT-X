import { useEffect, useRef } from 'react'
import { rand } from './useCanvas.js'
import { loadImage, playFile, reverb, session, tone, voice } from '../audio.js'
import { geo, mix, rgb } from '../gl/mesh.js'
import { chain, move, turnY } from '../gl/m4.js'
import { useRetroGL } from '../gl/useRetroGL.js'

// Level 2 — heaven, played for laughs, the way a PS2 game would try for it: a
// janky low-poly stairway climbing into "realistic" billboard clouds under
// low-poly god rays, and at the top the crowd waiting for you:
// public/fx/l2-heaven-crowd.jpg, a band cut from the "everyone in heaven" meme
// (swap in any wide picture, about 2.3:1). A flash of white, then the camera
// tilts up from the steps to them. Choir and harp; drop public/fx/l2-heaven.mp3
// in to replace them.
const CHORDS = [
  [50, 62, 66, 69], // D
  [55, 62, 67, 71], // G/D
  [57, 64, 69, 73], // A
  [50, 62, 66, 69], // D
]
const hz = (m) => 440 * 2 ** ((m - 69) / 12)
const clamp01 = (x) => Math.min(1, Math.max(0, x))
const smooth = (x) => {
  const k = clamp01(x)
  return k * k * (3 - 2 * k)
}
const CROWD = ['l2-heaven-crowd.jpg', 'l2-heaven-crowd.png', 'l2-heaven-crowd.webp']

const STEPS = 24
const RISE = 0.3
const RUN = 0.7
const TOP = STEPS * RISE
const TOP_Z = -STEPS * RUN
const CROWD_W = 18
const CROWD_AT = [0, TOP + 3.6, TOP_Z - 1.2] // the crowd's middle
const LIGHT = [0, TOP + 6.5, TOP_Z - 7]
const SKY_TOP = rgb('#2a6fd6')
const SKY_LOW = rgb('#a8d4ff')
const HAZE = rgb('#a9d2ff')

// value noise, a few octaves
const vnoise = (x, y, s) => {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const h = (i, j) => rand(i * 131 + j * 977 + s * 7919, 3)
  const sx = (x - xi) ** 2 * (3 - 2 * (x - xi))
  const sy = (y - yi) ** 2 * (3 - 2 * (y - yi))
  const a = h(xi, yi) + (h(xi + 1, yi) - h(xi, yi)) * sx
  const b = h(xi, yi + 1) + (h(xi + 1, yi + 1) - h(xi, yi + 1)) * sx
  return a + (b - a) * sy
}
const fbm = (x, y, s) => {
  let n = 0
  let amp = 0.5
  for (let o = 0; o < 4; o++) {
    n += amp * vnoise(x * 2 ** o, y * 2 ** o, s + o)
    amp /= 2
  }
  return n
}

// Four cumulus cards in a 2 × 2 atlas, trying hard to look real: heaped lobes on a
// flat-ish base, noisy wisps at the edges, lit from above (white tops, grey-blue
// undersides).
const CELL_W = 256
const CELL_H = 144
function cloudAtlas() {
  const c = document.createElement('canvas')
  c.width = CELL_W * 2
  c.height = CELL_H * 2
  const g = c.getContext('2d')
  const img = g.createImageData(c.width, c.height)
  for (let v = 0; v < 4; v++) {
    const ox = (v % 2) * CELL_W
    const oy = (v >> 1) * CELL_H
    const lobes = Array.from({ length: 6 }, (_, i) => ({
      x: 0.16 + i * 0.135 + (rand(v, i) - 0.5) * 0.06,
      y: 0.6 - rand(v, i + 7) * 0.2 - (i > 0 && i < 5 ? 0.08 : 0),
      r: 0.13 + rand(v, i + 3) * 0.11 + (i > 1 && i < 4 ? 0.05 : 0),
    }))
    for (let y = 0; y < CELL_H; y++) {
      for (let x = 0; x < CELL_W; x++) {
        const u = x / CELL_W
        const w = y / CELL_H
        let m = 0
        for (const L of lobes) m = Math.max(m, 1 - Math.hypot((u - L.x) * (CELL_W / CELL_H), w - L.y) / L.r)
        const base = 1 - smooth((w - 0.72) / 0.12) // flat-ish bottom
        const n = fbm(u * 7 + v * 13, w * 4, v * 5)
        const d = m * base + (n - 0.5) * 0.45
        const a = smooth((d - 0.02) / 0.3)
        const lit = clamp01(0.42 + (0.6 - w) * 1.6 + (n - 0.5) * 0.7)
        const k = ((oy + y) * c.width + ox + x) * 4
        img.data[k] = 122 + 133 * lit
        img.data[k + 1] = 140 + 115 * lit
        img.data[k + 2] = 178 + 77 * lit
        img.data[k + 3] = 255 * a
      }
    }
  }
  g.putImageData(img, 0, 0)
  return c
}
const cellUV = (v) => {
  const u0 = (v % 2) / 2
  const v0 = (v >> 1) / 2
  return [[u0, v0 + 0.5], [u0 + 0.5, v0 + 0.5], [u0 + 0.5, v0], [u0, v0]]
}

// the crowd, its edges melted so it sits in the clouds
function feather(im) {
  const c = document.createElement('canvas')
  const k = Math.min(1, 1024 / im.width)
  c.width = Math.max(1, Math.round(im.width * k))
  c.height = Math.max(1, Math.round(im.height * k))
  const g = c.getContext('2d')
  g.drawImage(im, 0, 0, c.width, c.height)
  g.globalCompositeOperation = 'destination-in'
  const v = g.createLinearGradient(0, 0, 0, c.height)
  v.addColorStop(0, 'rgba(0,0,0,0)')
  v.addColorStop(0.1, 'rgba(0,0,0,1)')
  v.addColorStop(0.82, 'rgba(0,0,0,1)')
  v.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = v
  g.fillRect(0, 0, c.width, c.height)
  const s = g.createLinearGradient(0, 0, c.width, 0)
  s.addColorStop(0, 'rgba(0,0,0,0)')
  s.addColorStop(0.06, 'rgba(0,0,0,1)')
  s.addColorStop(0.94, 'rgba(0,0,0,1)')
  s.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = s
  g.fillRect(0, 0, c.width, c.height)
  return c
}

function glowTexture() {
  const c = document.createElement('canvas')
  c.width = 64
  c.height = 64
  const x = c.getContext('2d')
  const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32)
  gr.addColorStop(0, 'rgba(255,255,255,1)')
  gr.addColorStop(0.3, 'rgba(255,248,225,0.75)')
  gr.addColorStop(1, 'rgba(255,240,200,0)')
  x.fillStyle = gr
  x.fillRect(0, 0, 64, 64)
  return c
}

// janky: every slab a little off in width, height and angle
function stairway() {
  const g = geo()
  for (let i = 0; i < STEPS; i++) {
    const tint = mix([0.9, 0.94, 1], [1, 1, 1], rand(i, 4))
    const m = chain(move(0, i * RISE, -i * RUN), turnY((rand(i, 1) - 0.5) * 0.08))
    g.box({ x: (rand(i, 2) - 0.5) * 0.12, y: -0.6, z: 0, w: 3.2 + (rand(i, 3) - 0.5) * 0.3, h: 0.6 + RISE + (rand(i, 5) - 0.5) * 0.05, d: RUN + 0.06, col: tint, m })
  }
  return g.data
}

// god rays: long flat shafts from the light behind the crowd, fanning down the stairs
function shafts() {
  const g = geo()
  for (let k = 0; k < 9; k++) {
    const end = [(k - 4) * 2.3 + (rand(k, 1) - 0.5) * 1.5, -1 + rand(k, 2) * 4, -2 + rand(k, 3) * 7]
    const w0 = 0.15
    const w1 = 0.9 + rand(k, 4) * 1.3
    const col = mix([1, 0.95, 0.78], [1, 1, 1], rand(k, 5))
    g.quad([LIGHT[0] - w0, LIGHT[1], LIGHT[2]], [LIGHT[0] + w0, LIGHT[1], LIGHT[2]], [end[0] + w1, end[1], end[2]], [end[0] - w1, end[1], end[2]], col)
  }
  return g.data
}

// where the cloud cards go: x, y, z, width, variant. A few far off in the sky, a
// bank under and around the stairs, and a frame either side of the crowd.
function cloudPlan() {
  const out = []
  const add = (x, y, z, w, i) => out.push({ x, y, z, w, v: i % 4, p: rand(i, 9) * 6.28 })
  for (let i = 0; i < 6; i++) add((rand(i, 1) - 0.5) * 70, 6 + rand(i, 2) * 16, -45 - rand(i, 3) * 15, 14 + rand(i, 4) * 10, i)
  for (let i = 0; i < 14; i++) {
    const side = i % 2 ? 1 : -1
    const along = rand(i, 11)
    add(side * (2.6 + rand(i, 12) * 7), along * TOP - 1.8 + rand(i, 13) * 1.2, 3 - along * 20, 4 + rand(i, 14) * 4, i + 6)
  }
  for (let i = 0; i < 5; i++) add((rand(i, 21) - 0.5) * 26, -3 + rand(i, 22), -4 - rand(i, 23) * 16, 6 + rand(i, 24) * 4, i + 20)
  for (let i = 0; i < 6; i++) {
    const side = i % 2 ? 1 : -1
    add(side * (CROWD_W * 0.42 + rand(i, 31) * 6), TOP + 0.5 + rand(i, 32) * 4, TOP_Z - 0.2 + rand(i, 33) * 1.5, 5 + rand(i, 34) * 4, i + 28)
  }
  return out
}

export default function L2Heaven({ speed = 1 }) {
  const crowd = useRef(null)
  useEffect(() => {
    loadImage(CROWD, (im) => {
      crowd.current = { im, tex: null }
    })
  }, [])

  useEffect(() => {
    const s = session(0.85)
    if (!s) return
    playFile(s, 'l2-heaven.mp3').then((ok) => {
      if (ok || !s.alive) return
      const room = reverb(s, 4, 2.2, 0.7)
      // harp glissando on the cut
      ;[62, 66, 69, 74, 78, 81, 86].forEach((m, i) => tone(s, { freq: hz(m), type: 'sine', at: i * 0.07, dur: 1.6, gain: 0.05, dest: room }))
      // choir: one sustained "ahh" chord every 3 s
      CHORDS.forEach((chord, c) =>
        chord.forEach((m, i) => voice(s, { freq: hz(m), at: 0.2 + c * 3, dur: 3.6, gain: i === 0 ? 0.05 : 0.035, attack: 0.9, dest: room })),
      )
    })
    return () => s.stop()
  }, [])

  const ref = useRetroGL((r) => {
    const sky = r.mesh(geo().ball({ r: 120, rings: 8, sides: 12, shade: (h) => mix(SKY_LOW, SKY_TOP, Math.max(0, h) ** 0.6) }).data)
    const steps = r.mesh(stairway())
    const rays = r.mesh(shafts())
    const atlas = r.texture(cloudAtlas())
    const glow = r.texture(glowTexture())
    const plan = cloudPlan()
    const far = r.mesh([], true)
    const near = r.mesh([], true)
    const halo = r.mesh([], true)
    const board = r.mesh([], true)
    return (t) => {
      const ts = t * speed
      // on the steps, then tilting up to the crowd (a little higher up the stairs)
      const up = smooth((ts - 0.5) / 1.7)
      const eye = [Math.sin(ts * 0.3) * 0.25, 1.5 + up * 1.2, 4.5 - up * 2]
      const at = [0, -1.4 + up * (CROWD_AT[1] - 3.4 + 1.4), -1 + up * (CROWD_AT[2] + 1)]
      // the cut: blown out white, settling
      const fade = 1 + 2.4 * Math.exp(-ts * 2.4)
      r.begin({ eye, at, fov: 62, far: 220 }, { fog: HAZE, fogNear: 30, fogFar: 95, light: [0.2, -0.8, 0.5], lightCol: [0.38, 0.37, 0.33], ambient: [0.82, 0.84, 0.88], bloom: 0.55, glowFrom: 0.95, fade })
      r.draw(sky, undefined, { lit: false, fog: false })

      // cloud cards, back to front (they don't write depth)
      const depth = (c) => (c.x - eye[0]) * r.fwd[0] + (c.y - eye[1]) * r.fwd[1] + (c.z - eye[2]) * r.fwd[2]
      const cards = (list) => {
        const g = geo()
        list
          .map((c) => ({ c, d: depth(c) }))
          .filter((o) => o.d > 0.5)
          .sort((p, q) => q.d - p.d)
          .forEach(({ c }) => g.sprite([c.x + Math.sin(ts * 0.15 + c.p) * 0.6, c.y, c.z], r.right, r.up, c.w / 2, (c.w / 2) * (CELL_H / CELL_W), [1, 1, 1], cellUV(c.v)))
        return g.data
      }
      far.update(cards(plan.filter((c) => c.z < -40)))
      r.draw(far, undefined, { tex: atlas, lit: false, blend: 'alpha', cut: 0.02 })

      // the light behind them, and them
      halo.update(geo().sprite(LIGHT, r.right, r.up, 9, 9, [1, 0.97, 0.88]).data)
      r.draw(halo, undefined, { tex: glow, lit: false, fog: false, blend: 'add' })
      const c = crowd.current
      if (c) {
        c.tex ??= r.texture(feather(c.im))
        const ch = CROWD_W * (c.im.height / c.im.width)
        const [x, y, z] = CROWD_AT
        board.update(geo().quad([x - CROWD_W / 2, y - ch / 2, z], [x + CROWD_W / 2, y - ch / 2, z], [x + CROWD_W / 2, y + ch / 2, z], [x - CROWD_W / 2, y + ch / 2, z], [1, 1, 1]).data)
        r.draw(board, undefined, { tex: c.tex, lit: false, fog: false, blend: 'alpha', cut: 0.02 })
      }

      r.draw(steps)
      near.update(cards(plan.filter((c) => c.z >= -40)))
      r.draw(near, undefined, { tex: atlas, lit: false, blend: 'alpha', cut: 0.02 })
      r.draw(rays, undefined, { lit: false, fog: false, blend: 'add', alpha: 0.2 + 0.04 * Math.sin(ts * 1.1), tint: [1, 0.92, 0.7], depthWrite: false })
      r.end()
    }
  })

  return (
    <div className="scene">
      <canvas ref={ref} className="scene-canvas retro" aria-label="บันไดสู่สวรรค์ มีคนดังรออยู่ข้างบน" />
    </div>
  )
}
