import { useEffect, useMemo, useRef } from 'react'
import { rand, useCanvas } from './useCanvas.js'
import { loadImage, noise, session, tone } from '../audio.js'

// Level 3 — storm. The figure in the background only shows when lightning hits.
// Drop public/fx/lowtiergod.(png|jpg|webp) in to use your own image; otherwise a silhouette.
// A cut-out (transparent PNG) stands full-height at the bottom; a plain photo fills the screen.
const STRIKES = (() => {
  const out = []
  let t = 0.35
  for (let i = 0; i < 12; i++) {
    out.push(t)
    t += 1.1 + rand(i, 9) * 1.3
  }
  return out
})()

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

function boltPath(seed, w, h) {
  const pts = [[(0.25 + rand(seed, 1) * 0.5) * w, -10]]
  const branches = []
  let [x, y] = pts[0]
  const end = h * (0.75 + rand(seed, 2) * 0.2)
  let i = 0
  while (y < end) {
    i++
    y += h * (0.03 + rand(seed * 7 + i, 3) * 0.05)
    x += (rand(seed * 7 + i, 4) - 0.5) * w * 0.07
    pts.push([x, y])
    if (rand(seed * 7 + i, 5) > 0.82) {
      const b = [[x, y]]
      let bx = x
      let by = y
      for (let k = 0; k < 5; k++) {
        by += h * 0.035
        bx += (rand(seed * 13 + i * 5 + k, 6) - 0.3) * w * 0.05 * (rand(seed + i, 7) > 0.5 ? 1 : -1)
        b.push([bx, by])
      }
      branches.push(b)
    }
  }
  return [pts, ...branches]
}

export default function L3Thunder({ speed = 1 }) {
  const img = useRef(null)
  useEffect(() => {
    loadImage(['lowtiergod.png', 'lowtiergod.jpg', 'lowtiergod.webp'], (im) => {
      img.current = { im, cutout: hasTransparency(im) }
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

  const drops = useMemo(() => Array.from({ length: 160 }, (_, i) => ({ x: rand(i, 1), y: rand(i, 2), v: 0.9 + rand(i, 3) * 0.6 })), [])

  const ref = useCanvas((ctx, { w, h, t }) => {
    const ts = t * speed
    // flash envelope: double flicker per strike
    let lit = 0
    let active = -1
    STRIKES.forEach((at, i) => {
      const d = ts - at
      if (d >= 0 && d < 0.6) {
        const f = Math.exp(-d * 9) + 0.7 * Math.exp(-Math.max(0, d - 0.13) * 11) * (d > 0.13 ? 1 : 0)
        if (f > lit) {
          lit = Math.min(1, f)
          active = i
        }
      }
    })

    const sky = ctx.createLinearGradient(0, 0, 0, h)
    sky.addColorStop(0, '#03050b')
    sky.addColorStop(1, '#0b1020')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, w, h)
    if (lit > 0) {
      ctx.fillStyle = `rgba(210,225,255,${lit * 0.65})`
      ctx.fillRect(0, 0, w, h)
    }

    // the figure: lit only by lightning
    if (lit > 0.02) {
      const fig = img.current
      if (fig) {
        const { im, cutout } = fig
        // cut-out: fit the height, stand on the ground; photo: cover the screen
        const k = cutout ? h / im.height : Math.max(w / im.width, h / im.height)
        const dw = im.width * k
        const dh = im.height * k
        ctx.globalAlpha = lit
        ctx.filter = 'grayscale(1) contrast(1.8) brightness(1.3)'
        if (cutout) {
          ctx.shadowColor = `rgba(170,200,255,${lit})`
          ctx.shadowBlur = 40 * lit
        }
        ctx.drawImage(im, (w - dw) / 2, cutout ? h - dh : (h - dh) / 2, dw, dh)
        ctx.shadowBlur = 0
        ctx.filter = 'none'
        ctx.globalAlpha = 1
      } else {
        const cx = w / 2
        const u = h / 100
        ctx.fillStyle = `rgba(4,6,12,${Math.min(1, lit * 1.4)})`
        ctx.beginPath()
        ctx.arc(cx, 40 * u, 9 * u, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.moveTo(cx - 9 * u, 50 * u)
        ctx.quadraticCurveTo(cx - 26 * u, 54 * u, cx - 30 * u, 70 * u)
        ctx.lineTo(cx - 34 * u, 100 * u)
        ctx.lineTo(cx + 34 * u, 100 * u)
        ctx.lineTo(cx + 30 * u, 70 * u)
        ctx.quadraticCurveTo(cx + 26 * u, 54 * u, cx + 9 * u, 50 * u)
        ctx.closePath()
        ctx.fill()
        ctx.fillStyle = `rgba(140,220,255,${lit})`
        ctx.fillRect(cx - 4.5 * u, 39 * u, 2.4 * u, 1.2 * u)
        ctx.fillRect(cx + 2.1 * u, 39 * u, 2.4 * u, 1.2 * u)
      }
    }

    // rain
    ctx.strokeStyle = `rgba(170,190,230,${0.25 + lit * 0.4})`
    ctx.lineWidth = 1
    ctx.beginPath()
    for (const d of drops) {
      const y = ((d.y + t * d.v * 1.4) % 1) * h
      const x = ((d.x + t * 0.08) % 1) * w
      ctx.moveTo(x, y)
      ctx.lineTo(x - 4, y + 18)
    }
    ctx.stroke()

    // the bolt itself
    if (active >= 0 && ts - STRIKES[active] < 0.22) {
      const paths = boltPath(active + 1, w, h)
      for (const [width, color] of [[7, 'rgba(150,180,255,0.35)'], [2.2, '#ffffff']]) {
        ctx.strokeStyle = color
        ctx.lineWidth = width
        ctx.lineJoin = 'round'
        paths.forEach((p, j) => {
          ctx.lineWidth = j === 0 ? width : width * 0.5
          ctx.beginPath()
          p.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
          ctx.stroke()
        })
      }
    }
  })

  return (
    <div className="scene">
      <canvas ref={ref} className="scene-canvas" aria-label="พายุฟ้าผ่า" />
    </div>
  )
}
