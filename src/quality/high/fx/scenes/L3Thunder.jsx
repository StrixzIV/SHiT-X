import { useEffect, useRef } from 'react'
import { loadImage, noise, session, tone } from '../audio.js'
import { geo, mix, rgb } from '../gl/mesh.js'
import { useRetroGL } from '../gl/useRetroGL.js'
import { rand } from './useCanvas.js'

// Level 3 — storm over a flooded soi at night, low-poly: shophouses, power poles,
// rain, and lightning. The figure at the end of the street only shows when it
// strikes. Drop public/fx/lowtiergod.(png|jpg|webp) in: a cut-out stands there as
// a giant, a plain photo fills the sky; without one, a dark silhouette.
const STRIKES = (() => {
  const out = []
  let t = 0.35
  for (let i = 0; i < 12; i++) {
    out.push(t)
    t += 1.1 + rand(i, 9) * 1.3
  }
  return out
})()

const NIGHT = rgb('#04060c')
const FLASH = rgb('#9fb4dc')
const GIANT_Z = -36

// Does the image have see-through pixels? (sampled small, once on load)
function hasTransparency(im) {
  try {
    const c = document.createElement('canvas')
    c.width = 48
    c.height = 48
    const x = c.getContext('2d')
    x.drawImage(im, 0, 0, 48, 48)
    const a = x.getImageData(0, 0, 48, 48).data
    for (let i = 3; i < a.length; i += 4) if (a[i] < 250) return true
  } catch { /* cross-origin or no canvas: treat as a photo */ }
  return false
}

// lightning-lit look: grey, hard contrast, shrunk to an era-sized texture
function stormLit(im) {
  const k = Math.min(1, 256 / Math.max(im.width, im.height))
  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.round(im.width * k))
  c.height = Math.max(1, Math.round(im.height * k))
  const x = c.getContext('2d')
  x.drawImage(im, 0, 0, c.width, c.height)
  try {
    const d = x.getImageData(0, 0, c.width, c.height)
    const p = d.data
    for (let i = 0; i < p.length; i += 4) {
      const l = Math.min(255, Math.max(0, (0.3 * p[i] + 0.59 * p[i + 1] + 0.11 * p[i + 2] - 128) * 1.7 + 150))
      p[i] = l
      p[i + 1] = l
      p[i + 2] = Math.min(255, l * 1.08)
    }
    x.putImageData(d, 0, 0)
  } catch { /* keep the colour version */ }
  return c
}

// the town, plus the lit windows separately (they glow, unlit by the storm)
function street() {
  const g = geo()
  const glow = geo()
  const walls = ['#5b6170', '#6d5f55', '#4f5d63', '#6a6a5a', '#5f5560'].map(rgb)
  for (const side of [-1, 1]) {
    for (let k = 0; k < 9; k++) {
      const z = 6 - k * 5.4
      const h = 6 + rand(k * 2 + side, 1) * 4.5
      const x = side * 6.3
      g.box({ x, y: -1, z, w: 3.6, h, d: 5, col: walls[(k + (side > 0 ? 2 : 0)) % walls.length] })
      // floor bands, windows facing the street, a balcony per floor
      for (let f = 0; f < Math.floor(h / 2.6); f++) {
        const y = 1.2 + f * 2.6
        const face = x - side * 1.81
        for (const dz of [-1.3, 0, 1.3]) {
          const lit = rand(k * 31 + f * 7 + dz * 3 + side, 2) < 0.4
          const w = lit ? glow : g
          const col = lit ? rgb('#ffcf73') : rgb('#1a2433')
          const z0 = z + dz - 0.42
          const z1 = z + dz + 0.42
          if (side < 0) w.quad([face, y, z1], [face, y, z0], [face, y + 1.1, z0], [face, y + 1.1, z1], col)
          else w.quad([face, y, z0], [face, y, z1], [face, y + 1.1, z1], [face, y + 1.1, z0], col)
        }
        g.box({ x: x - side * 2.05, y: y - 0.25, z, w: 0.5, h: 0.12, d: 4.4, col: rgb('#3b3f47') })
      }
    }
  }
  // power poles with sagging wires
  const tops = { '-1': [], 1: [] }
  for (const side of [-1, 1]) {
    for (let k = 0; k < 7; k++) {
      const x = side * 3.9
      const z = 6 - k * 7
      g.tube({ x, y: -1, z, r: 0.13, h: 9, sides: 6, col: rgb('#6b6f75') })
      g.box({ x, y: 7.6, z, w: 1.8, h: 0.12, d: 0.12, col: rgb('#4b4f55') })
      tops[side].push([x, 7.75, z])
    }
  }
  for (const side of [-1, 1]) {
    const t = tops[side]
    for (let k = 0; k + 1 < t.length; k++) {
      for (const dx of [-0.75, 0.75]) {
        const a = [t[k][0] + dx, t[k][1], t[k][2]]
        const b = [t[k + 1][0] + dx, t[k + 1][1], t[k + 1][2]]
        const mid = [(a[0] + b[0]) / 2, a[1] - 0.6, (a[2] + b[2]) / 2]
        g.beam(a, mid, 0.04, rgb('#111317'))
        g.beam(mid, b, 0.04, rgb('#111317'))
      }
    }
  }
  return { town: g.data, windows: glow.data }
}

function stormClouds() {
  const g = geo()
  for (let i = 0; i < 14; i++) {
    g.ball({ x: (rand(i, 1) - 0.5) * 60, y: 20 + rand(i, 2) * 6, z: 10 - rand(i, 3) * 70, r: 5 + rand(i, 4) * 6, sy: 0.45, rings: 4, sides: 7, col: rgb('#2a3140') })
  }
  return g.data
}

// a jagged bolt from the clouds to the water, with a branch or two
function bolt(seed) {
  const pts = []
  let x = (rand(seed, 1) - 0.5) * 16
  let z = GIANT_Z + 6 + rand(seed, 2) * 18
  for (let y = 26; y > -0.2; y -= 1.6 + rand(seed * 5 + y, 3) * 1.4) {
    pts.push([x, y, z])
    x += (rand(seed * 7 + y, 4) - 0.5) * 2.4
    z += (rand(seed * 11 + y, 5) - 0.5) * 1.2
  }
  pts.push([x, -0.2, z])
  const branches = []
  for (let i = 2; i < pts.length - 3; i++) {
    if (rand(seed * 13 + i, 6) < 0.75) continue
    const b = [pts[i]]
    let [bx, by, bz] = pts[i]
    for (let k = 0; k < 4; k++) {
      by -= 1.4
      bx += (rand(seed * 17 + i * 5 + k, 7) - 0.3) * 2 * (rand(seed + i, 8) > 0.5 ? 1 : -1)
      b.push([bx, by, bz])
    }
    branches.push(b)
  }
  return [pts, ...branches]
}

export default function L3Thunder({ speed = 1 }) {
  const fig = useRef(null)
  useEffect(() => {
    loadImage(['lowtiergod.png', 'lowtiergod.jpg', 'lowtiergod.webp'], (im) => {
      fig.current = { im, cutout: hasTransparency(im), tex: null }
    })
  }, [])

  useEffect(() => {
    const s = session(0.9)
    if (!s) return
    noise(s, { dur: 60, gain: 0.05, type: 'lowpass', freq: 2800, loop: true, attack: 0.5 }) // rain
    STRIKES.forEach((at) =>
      s.later(() => {
        noise(s, { dur: 0.18, gain: 0.55, type: 'highpass', freq: 2600, sweepTo: 500 }) // crack
        noise(s, { at: 0.08, dur: 2.8, gain: 0.5, type: 'lowpass', freq: 220, sweepTo: 60, attack: 0.05 }) // rumble
        tone(s, { freq: 55, slideTo: 28, type: 'sine', at: 0.05, dur: 1.6, gain: 0.35 })
      }, (at * 1000) / speed),
    )
    return () => s.stop()
  }, [speed])

  const ref = useRetroGL((r) => {
    const sky = r.mesh(geo().ball({ r: 120, rings: 6, sides: 10, shade: (h) => mix(rgb('#05080f'), rgb('#0b1322'), Math.max(0, h)) }).data)
    const built = street()
    const town = r.mesh(built.town)
    const windows = r.mesh(built.windows)
    const clouds = r.mesh(stormClouds())
    const water = r.mesh([], true)
    const rain = r.mesh([], true)
    const flashMesh = r.mesh([], true)
    const giant = r.mesh([], true)
    const shadow = r.mesh(
      geo()
        .box({ x: 0, y: -1, z: GIANT_Z, w: 4.5, h: 9, d: 2.5, col: rgb('#05070b') })
        .ball({ x: 0, y: 10, z: GIANT_Z, r: 1.6, rings: 4, sides: 7, col: rgb('#05070b') })
        .data,
    )
    const eyes = r.mesh(geo().box({ x: -0.55, y: 10.1, z: GIANT_Z + 1.55, w: 0.45, h: 0.18, d: 0.05, col: [0.6, 0.9, 1] }).box({ x: 0.55, y: 10.1, z: GIANT_Z + 1.55, w: 0.45, h: 0.18, d: 0.05, col: [0.6, 0.9, 1] }).data)
    const drops = Array.from({ length: 360 }, (_, i) => ({ x: rand(i, 1), y: rand(i, 2), z: rand(i, 3), v: 0.8 + rand(i, 4) * 0.4 }))
    return (t) => {
      const ts = t * speed
      // flash envelope: a double flicker per strike
      let lit = 0
      let active = -1
      STRIKES.forEach((at, i) => {
        const d = ts - at
        if (d < 0 || d > 0.6) return
        const f = Math.exp(-d * 9) + (d > 0.13 ? 0.7 * Math.exp(-(d - 0.13) * 11) : 0)
        if (f > lit) {
          lit = Math.min(1, f)
          active = i
        }
      })
      const shake = lit * 0.08
      const eye = [Math.sin(t * 0.4) * 0.4 + (rand(Math.floor(t * 30), 1) - 0.5) * shake, 1.7 + (rand(Math.floor(t * 30), 2) - 0.5) * shake, 8 - Math.min(t, 12) * 0.5]
      const air = mix(NIGHT, FLASH, lit * 0.8)
      r.begin({ eye, at: [0, 4.5, GIANT_Z], fov: 60, far: 160 }, {
        clear: air, fog: air, fogNear: 10, fogFar: 48,
        light: [0.3, -1, 0.4], lightCol: [0.15 + lit * 1.1, 0.17 + lit * 1.15, 0.24 + lit * 1.25], ambient: [0.18 + lit * 0.5, 0.2 + lit * 0.5, 0.28 + lit * 0.55],
        bloom: 0.9, glowFrom: 0.7,
      })
      r.draw(sky, undefined, { lit: false, fog: false, tint: [1 + lit * 5, 1 + lit * 5, 1 + lit * 5.5] })
      r.draw(clouds, undefined, { fog: false })
      r.draw(town)
      r.draw(windows, undefined, { lit: false })
      // the flood: slow ripples
      water.update(geo().field({ x: 0, z: -18, w: 34, d: 64, n: 26, fn: (x, z) => 0.09 * Math.sin(x * 0.7 + t * 1.3) + 0.06 * Math.sin(z * 0.9 - t * 1.1), col: () => rgb('#16263a') }).data)
      r.draw(water)
      // the figure: only in the flashes
      const f = fig.current
      if (lit > 0.03) {
        if (f) {
          f.tex ??= r.texture(stormLit(f.im))
          const aspect = f.im.width / f.im.height
          const g = geo()
          if (f.cutout) g.sprite([0, 9.5, GIANT_Z], r.right, [0, 1, 0], 10.5 * aspect, 10.5)
          else g.quad([-34, -2, GIANT_Z - 14], [34, -2, GIANT_Z - 14], [34, 40, GIANT_Z - 14], [-34, 40, GIANT_Z - 14], [1, 1, 1])
          giant.update(g.data)
          r.draw(giant, undefined, { tex: f.tex, lit: false, fog: false, blend: 'alpha', alpha: Math.min(1, lit * 1.5), cut: 0.02, tint: [1.2, 1.2, 1.25] })
        } else {
          r.draw(shadow, undefined, { lit: false, fog: false, blend: 'alpha', alpha: Math.min(1, lit * 1.4) })
          r.draw(eyes, undefined, { lit: false, fog: false, blend: 'add', alpha: lit })
        }
      }
      // rain around the camera
      const g = geo()
      for (const d of drops) {
        const x = eye[0] + (d.x - 0.5) * 22
        const y = 14 - ((d.y * 14 + t * 13 * d.v) % 14)
        const z = eye[2] - 1.5 - d.z * 24
        g.sprite([x, y, z], r.right, [0.08, 1, 0], 0.012, 0.32, [0.62, 0.72, 0.9])
      }
      rain.update(g.data)
      r.draw(rain, undefined, { lit: false, blend: 'add', alpha: 0.35 + lit * 0.4 })
      // the bolt itself
      if (active >= 0 && ts - STRIKES[active] < 0.22) {
        const b = geo()
        bolt(active + 1).forEach((path, j) => {
          for (let i = 0; i + 1 < path.length; i++) {
            b.beam(path[i], path[i + 1], j ? 0.25 : 0.55, [0.55, 0.65, 1])
            b.beam(path[i], path[i + 1], j ? 0.06 : 0.12, [1, 1, 1])
          }
        })
        flashMesh.update(b.data)
        r.draw(flashMesh, undefined, { lit: false, fog: false, blend: 'add' })
      }
      r.end()
    }
  })

  return (
    <div className="scene">
      <canvas ref={ref} className="scene-canvas retro" aria-label="พายุฟ้าผ่าในซอยน้ำท่วม" />
    </div>
  )
}
