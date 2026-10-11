import { useEffect, useRef } from 'react'
import { useCanvas } from './useCanvas.js'
import { noise, reverb, session, tone } from '../audio.js'
import { CONSOLE_SIZE, useRetro } from '../../retro.js'
import { CUBES, LIGHTS, TRAIL, createGlass, fogTexture, lightAt } from './ps2boot.js'

// The calculation screen's backdrop: our take on the PS2 boot screen, ported
// from the PS2 skin in ft_blueprint by the same author (ps2boot.js). Black space
// with blue fog drifting in two layers, six glass cubes tumbling, four coloured
// lights with a glowing head and a hairline trail. With WebGL2 the cubes are real
// glass (ps2boot.js createGlass: refraction and reflection of what's behind);
// without it, the canvas original's dark glass with a sliding reflection band.
// Stateless: a trail is the light's own path sampled back in time.
// `zoom` is the PS2-style way out: the camera dives in faster and faster while
// rolling anticlockwise (each layer grows at its own rate, so the cubes fly past
// and the lights streak), the last frame stacked over each new one, fading (the
// era's frame-stacking blur), a flare, then a beat in the void where only the
// smoke is left, drifting closer and fading out, before the overlay cuts to the result.
// Drawn at console resolution (retro.js), like the scenes.
export const ZOOM_S = 2.4
const DIVE = 1.4 / ZOOM_S // the dive's share of the zoom; the rest is the void

const CUBE_V = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]]
const CUBE_F = [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [2, 3, 7, 6], [1, 2, 6, 5], [0, 3, 7, 4]]
const sprites = new Map()
function sprite(col) {
  let c = sprites.get(col)
  if (!c) {
    c = document.createElement('canvas')
    c.width = c.height = 32
    const g = c.getContext('2d')
    const r = g.createRadialGradient(16, 16, 0, 16, 16, 16)
    r.addColorStop(0, 'rgba(255,255,255,1)')
    r.addColorStop(0.12, col)
    r.addColorStop(0.35, col + '66')
    r.addColorStop(1, col + '00')
    g.fillStyle = r
    g.fillRect(0, 0, 32, 32)
    sprites.set(col, c)
  }
  return c
}


let fogs = null
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches
const clamp01 = (x) => Math.min(1, Math.max(0, x))

export default function Boot({ zoom = false, speed = 1 }) {
  const mode = useRetro()
  const zoomRef = useRef(zoom)
  const snd = useRef(null)
  const ambience = useRef(null)
  const last = useRef(null) // the previous frame, for the feedback blur
  const glass = useRef(null)
  const clock = useRef({ start: 0, zoomAt: null, still: false })
  useEffect(() => {
    zoomRef.current = zoom
  }, [zoom])

  // a low hum with glassy chimes; the zoom adds a rising whoosh and a thud
  useEffect(() => {
    fogs ??= [fogTexture(1), fogTexture(9)]
    glass.current = createGlass(fogs)
    return () => {
      glass.current?.dispose()
      glass.current = null
    }
  }, [])

  useEffect(() => {
    clock.current.start = performance.now()
    clock.current.still = still()
    const s = session(0.55)
    if (!s) return
    snd.current = s
    // the ambience on its own fader, so it can drop away into the void
    const amb = s.keep(s.ctx.createGain())
    amb.connect(s.out)
    ambience.current = amb
    const room = reverb(s, 4, 2.5, 0.7, amb)
    tone(s, { freq: 55, type: 'sine', dur: 40, gain: 0.13, attack: 1.5, dest: room })
    tone(s, { freq: 82.4, type: 'sine', dur: 40, gain: 0.06, attack: 2.5, dest: room })
    noise(s, { dur: 40, gain: 0.025, type: 'lowpass', freq: 320, loop: true, attack: 2, dest: amb })
    const steps = [0, 3, 5, 7, 10, 12]
    s.every(() => tone(s, { freq: 659 * 2 ** (steps[Math.floor(Math.random() * steps.length)] / 12), type: 'sine', dur: 2.4, gain: 0.022, attack: 0.01, dest: room }), 1300)
    return () => {
      snd.current = null
      ambience.current = null
      s.stop()
    }
  }, [])
  // the way out: a whoosh rising through the dive and a thud into the void; there
  // the hum drops away and a low swell and a rising hiss build into the cut
  useEffect(() => {
    const s = snd.current
    if (!zoom || !s) return
    const total = ZOOM_S / speed
    const dive = total * DIVE
    const hold = total - dive
    noise(s, { dur: dive, gain: 0.16, type: 'bandpass', freq: 180, sweepTo: 5000, q: 1.4, attack: dive * 0.8 })
    tone(s, { freq: 70, slideTo: 30, type: 'sine', at: dive * 0.92, dur: 1.1, gain: 0.32, attack: 0.01 })
    ambience.current?.gain.setTargetAtTime(0, s.now + dive * 0.85, 0.12)
    tone(s, { freq: 38, slideTo: 80, type: 'sine', at: dive + 0.08, dur: hold, gain: 0.24, attack: hold * 0.9 })
    noise(s, { at: dive + 0.2, dur: hold - 0.18, gain: 0.07, type: 'highpass', freq: 2600, attack: hold - 0.25 })
  }, [zoom, speed])

  const ref = useCanvas(
    (g, { w: W, h: H, dt }) => {
      const c = clock.current
      const now = (performance.now() - c.start) / 1000
      if (zoomRef.current && c.zoomAt == null) c.zoomAt = now
      const k = c.zoomAt == null ? 0 : Math.min(1, ((now - c.zoomAt) * speed) / ZOOM_S)
      const kd = Math.min(1, k / DIVE) // the dive
      const kv = Math.max(0, (k - DIVE) / (1 - DIVE)) // the void
      const fly = k > 0 && !c.still
      const t = c.still ? 40 : now + 30
      const CX = W / 2
      const CY = H * 0.47
      // the camera: in faster and faster, rolling anticlockwise, still drifting on into the void
      const z = 1 + 9 * kd * kd + 6 * kv
      const roll = fly ? -(1.9 * kd ** 1.6 + 0.8 * kv) : 0
      const rc = Math.cos(roll)
      const rs = Math.sin(roll)
      // a layer grows from the middle by z^p, turned by the roll
      const layer = (p) => {
        const sc = z ** p
        g.setTransform(sc * rc, sc * rs, -sc * rs, sc * rc, CX - sc * (rc * CX - rs * CY), CY - sc * (rs * CX + rc * CY))
      }
      // the cubes and lights dissolve as the dive ends; the smoke (the fog) thins on
      // the way in and lingers into the void, fading out by the cut
      const show = 1 - clamp01((k - 0.5) / 0.18)
      const smoke = (1 - 0.4 * kd) * (1 - kv) ** 1.3
      g.setTransform(1, 0, 0, 1, 0, 0)
      g.globalCompositeOperation = 'source-over'
      g.globalAlpha = 1
      g.fillStyle = '#000003'
      g.fillRect(0, 0, W, H)
      g.imageSmoothingEnabled = true

      const step = 0.018 * (1 + 4 * kd * kd) // trail spacing: stretched into streaks on the zoom
      if (glass.current) {
        glass.current.render(W, H, { t, z, roll, step, show, fogA: [0.85 * smoke, (0.55 + 0.1 * Math.sin(t * 0.3)) * smoke] })
        g.drawImage(glass.current.canvas, 0, 0, W, H)
      } else {
        // the fog: two layers drifting against each other, breathing a little
        fogs ??= [fogTexture(1), fogTexture(9)]
        layer(0.5)
        for (let i = 0; i < 2; i++) {
          const dir = i ? -1 : 1
          const ox = Math.sin(t * 0.045 + i * 2) * W * 0.04 * dir
          const oy = Math.cos(t * 0.037 + i) * H * 0.03
          g.globalAlpha = (i ? 0.55 + 0.1 * Math.sin(t * 0.3) : 0.85) * smoke
          g.drawImage(fogs[i], -W * 0.08 + ox, -H * 0.08 + oy, W * 1.16, H * 1.16)
        }
        g.globalAlpha = show

        // the glass cubes: faces sorted back to front; the far ones barely there,
        // the near ones tinted by where they point and crossed by a reflection
        // band that slides as the cube turns; no outlines. Nearer cubes rush past
        // faster on the zoom.
        const u = Math.min(W, H)
        const LX = -0.45
        const LY = -0.6
        const LZ = 0.66
        g.lineJoin = 'round'
        for (const C of CUBES) {
          layer(0.9 + C.depth * 2.4)
          const ax = C.p + t * C.rx
          const ay = C.p * 0.7 + t * C.ry
          const v3 = CUBE_V.map(([x, y, zz]) => {
            const y1 = y * Math.cos(ax) - zz * Math.sin(ax)
            const z1 = y * Math.sin(ax) + zz * Math.cos(ax)
            return [x * Math.cos(ay) + z1 * Math.sin(ay), y1, -x * Math.sin(ay) + z1 * Math.cos(ay)]
          })
          const cx = W / 2 + C.x * W
          const cy = H * 0.47 + C.y * H
          const pts = v3.map(([x, y, zz]) => {
            const pk = 3 / (4 - zz * 0.6)
            return [cx + x * C.s * u * pk, cy + y * C.s * u * pk]
          })
          const faces = CUBE_F.map((f) => ({ f, n: [0, 1, 2].map((i) => f.reduce((sum, v) => sum + v3[v][i], 0) / 4) })).sort((p, q) => p.n[2] - q.n[2])
          for (const { f, n } of faces) {
            const path = () => {
              g.beginPath()
              f.forEach((v, i) => (i ? g.lineTo(pts[v][0], pts[v][1]) : g.moveTo(pts[v][0], pts[v][1])))
              g.closePath()
            }
            path()
            if (n[2] <= 0) {
              g.fillStyle = 'rgba(3,5,16,0.12)'
              g.fill()
              continue
            }
            const lit = Math.max(0, n[0] * LX + n[1] * LY + n[2] * LZ)
            const xs = f.map((v) => pts[v][0])
            const ys = f.map((v) => pts[v][1])
            const x0 = Math.min(...xs)
            const x1 = Math.max(...xs)
            const y0 = Math.min(...ys)
            const y1 = Math.max(...ys)
            // dark glass, lighter where it faces the light
            const body = g.createLinearGradient(x0, y0, x1, y1)
            body.addColorStop(0, `rgba(${(60 + 70 * lit) | 0},${(80 + 70 * lit) | 0},${(170 + 50 * lit) | 0},${0.05 + 0.09 * lit})`)
            body.addColorStop(1, 'rgba(4,6,22,0.24)')
            g.fillStyle = body
            g.fill()
            // the reflection: a soft band with a sharp core, placed by the face's angle
            g.save()
            path()
            g.clip()
            const at = Math.min(0.92, Math.max(0.08, 0.5 + n[0] * 0.7 - n[1] * 0.5))
            const band = g.createLinearGradient(x0, y0, x1, y1)
            const a = (0.04 + 0.16 * lit * n[2]) * (1 + 1.5 * kd) // glints as it rushes past
            band.addColorStop(Math.max(0, at - 0.22), 'rgba(200,220,255,0)')
            band.addColorStop(Math.max(0, at - 0.03), `rgba(200,220,255,${a * 0.5})`)
            band.addColorStop(at, `rgba(235,242,255,${a})`)
            band.addColorStop(Math.min(1, at + 0.05), `rgba(200,220,255,${a * 0.25})`)
            band.addColorStop(Math.min(1, at + 0.15), 'rgba(200,220,255,0)')
            g.fillStyle = band
            g.fillRect(x0, y0, x1 - x0, y1 - y0)
            g.restore()
          }
        }

        // the lights: a glowing head and a hairline trail (stretched into streaks on the zoom)
        layer(0.8)
        g.globalCompositeOperation = 'lighter'
        // round caps bead up where stretched segments overlap, so flat ones on the zoom
        g.lineCap = kd > 0.2 ? 'butt' : 'round'
        const pos = (L, tt) => lightAt(L, tt, W, H)
        let head
        for (const L of LIGHTS) {
          head = pos(L, t - TRAIL * step)
          for (let n = TRAIL - 1; n >= 0; n--) {
            const cur = pos(L, t - n * step)
            g.globalAlpha = (1 - n / TRAIL) ** 1.6 * 0.9 * show
            g.strokeStyle = L.col
            g.lineWidth = n < 8 ? 1.4 : 1
            g.beginPath()
            g.moveTo(head.x, head.y)
            g.lineTo(cur.x, cur.y)
            g.stroke()
            head = cur
          }
          const d = (26 * head.k * H) / 900
          g.globalAlpha = show
          g.drawImage(sprite(L.col), head.x - d / 2, head.y - d / 2, d, d)
        }
      }

      g.setTransform(1, 0, 0, 1, 0, 0)
      let prev = last.current
      if (fly) {
        // the era's frame-stacking blur: the last frame laid over this one, faded,
        // so whatever moves leaves a trail of fading copies of itself. Laid over,
        // not under, so nothing builds up into a wash.
        prev ??= last.current = document.createElement('canvas')
        if (prev.width !== W || prev.height !== H) {
          prev.width = W
          prev.height = H
        }
        g.globalCompositeOperation = 'source-over'
        g.globalAlpha = (0.85 * clamp01(k / 0.12)) ** (dt * 60)
        g.drawImage(prev, 0, 0)
        // keep this frame for the next one's blur
        const pg = prev.getContext('2d')
        pg.globalAlpha = 1
        pg.globalCompositeOperation = 'copy'
        pg.drawImage(g.canvas, 0, 0)
        // a short blue-white flare at the end of the dive (not kept, so it can't build up)
        const flare = kd > 0.75 && kd < 1 ? Math.sin(((kd - 0.75) / 0.25) * Math.PI) * 0.22 : 0
        if (flare > 0) {
          g.globalCompositeOperation = 'lighter'
          g.globalAlpha = flare
          g.fillStyle = '#9fb8ff'
          g.fillRect(0, 0, W, H)
        }
      }
      // fade in at the start; black at the end of the void
      g.globalCompositeOperation = 'source-over'
      const black = Math.max(1 - now / 0.6, c.still ? k : kv > 0.7 ? ((kv - 0.7) / 0.3) ** 1.2 : 0)
      if (black > 0) {
        g.globalAlpha = Math.min(1, black)
        g.fillStyle = '#000'
        g.fillRect(0, 0, W, H)
      }
      g.globalAlpha = 1
    },
    { size: CONSOLE_SIZE[mode] },
  )

  return <canvas ref={ref} className="scene-canvas retro" aria-hidden />
}
