import { useEffect, useState } from 'react'
import { noise, session, tone } from '../audio.js'
import { shot } from './gargantua.js'
import { createUiLens } from './uiLens.js'

// L7: the result sheet slides up, Gargantua grabs it and keeps it in orbit.
// · drag it to fling it; gravity bends it back into a lap
// · hover, clicks, taps and keyboard focus never slow or enlarge it
// · leave it alone or drop it into the hole: swallowed, then spat back out
// Physics runs in the orbital plane (u → toward the open sky, w → away from the
// viewer) and is projected with mild perspective. The home lap is a Kepler ellipse
// with the hole at a focus (semi-major axis 1): the card dawdles out in the open sky
// where it can be read, then whips round the hole. On the far side the card is
// lensed out past the shadow, and masked wherever it still overlaps it.

const PERSP = 0.22
const TILT = 0.42 // the lap is seen from a little above: squash across its long axis
const LAP = 16 // seconds per lap
const GM = ((2 * Math.PI) / LAP) ** 2
const SOFT = 0.1
const VMAX = 2.5
const ORBIT_SIZE = 0.7
const IDLE_S = 20
const FALL_S = 1
const GONE_S = 3

const NOTE = {
  hint: 'ลากหัวการ์ดเพื่อเหวี่ยง · ปล่อยไว้เดี๋ยวโดนกิน',
  fall: 'ผลลัพธ์ของท่านตกลงไปในหลุมดำ…',
  gone: 'หลุมดำกำลังเคี้ยวผลลัพธ์… รอให้มันคายออกมาก่อน',
  back: '…และระเหยกลับออกมาเป็นรังสีฮอว์คิง (ปกติใช้เวลา ~10⁹¹ ปี)',
}

const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x))
const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}
const ease = (x, to, rate, dt) => x + (to - x) * (1 - Math.exp(-rate * dt))
const persp = (w) => 1 / (1 + w * PERSP)
const interactive = (t) => t.closest?.('a, button, input, select, textarea, label')

// Puts the `.result` sheet in `ref` into orbit while `on`. Returns the subtitle to show.
export function useOrbit(ref, on) {
  const [note, setNote] = useState(null)

  useEffect(() => {
    const el = ref.current
    if (!on || !el || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const scene = el.parentElement?.querySelector('.scene')
    const snd = session(0.8)
    const uiLens = createUiLens(el)
    const surface = el.parentElement

    let L // screen layout, see layout()
    let mode = 'dock' // dock → tremor → free ⇄ held;  free → fall → gone → free
    let modeT = 0
    let pullT = 0 // seconds since the hole last grabbed (or spat out) the card
    let clock = 0
    let u = 0
    let w = 0
    let vu = 0
    let vw = 0
    let keep = 0 // orbit-keeping strength, ramps up after a capture or a fling
    let zoom = 1 // multiplier on the orbit scale
    let tilt = 0
    let spin = 0
    let ox = 0 // screen offset for the capture hand-off
    let oy = 0
    let lensK = 0
    let tide = 0
    let fade = 1
    let lastInteraction = performance.now() // wall time: shader frame rate must not stretch the idle wait
    let goneAt = 0
    let grab = null
    let press = null
    let dragged = false
    let fall = null
    let cur = { x: 0, y: 0, S: 1, matrix: null }
    let mask = ''
    let shadow = null
    let shown = null
    let hintFrom = Infinity
    let hintUntil = 0
    let backUntil = 0
    let raf = 0
    let last = 0

    const layout = () => {
      const r = scene?.getBoundingClientRect() ?? { left: 0, top: 0, width: innerWidth, height: innerHeight }
      const cw = el.offsetWidth
      const ch = el.offsetHeight
      const hole = shot(r.width, r.height)
      const cx = r.left + hole.x
      const cy = r.top + hole.y
      const b = clamp(Math.min(0.62, (0.46 * r.height) / ch, (0.7 * r.width) / cw), 0.3, 0.62) * ORBIT_SIZE
      // apoapsis: the card fully on screen in the open sky (top right; top centre on
      // portrait screens, where the lap is also flatter so its sides stay in view)
      const narrow = r.width < r.height
      const tx = r.left + (narrow ? r.width / 2 : r.width - 16 - (b * cw) / 2)
      const ty = r.top + Math.max(0.3 * r.height, 16 + (b * ch) / 2)
      const rA = Math.min(Math.hypot(tx - cx, ty - cy), 3 * hole.r)
      const rP = Math.min(1.1 * hole.r, 0.7 * rA) // periapsis: just clear of the shadow
      const K = (rA + rP) / 2 // px per plane unit
      const turn = Math.atan2(ty - cy, tx - cx) // the lap's long axis on screen
      L = { cx, cy, R: hole.r, K, Ay: K * (narrow ? 0.28 : TILT), e: (rA - rP) / (rA + rP), cos: Math.cos(turn), sin: Math.sin(turn), cw, ch, b }
    }
    const project = (pu, pw) => {
      const s = persp(pw)
      const a = pu * L.K * s
      const c = -pw * L.Ay * s
      return [L.cx + a * L.cos - c * L.sin, L.cy + a * L.sin + c * L.cos]
    }
    const unproject = (x, y) => {
      const dx = x - L.cx
      const dy = y - L.cy
      const up = Math.min(dx * L.sin - dy * L.cos, (0.8 * L.Ay) / PERSP)
      const pw = clamp(up / (L.Ay - up * PERSP), -2.5, 6)
      return [(dx * L.cos + dy * L.sin) / L.K / persp(pw), pw]
    }
    // Behind the hole the card's image is pushed out past the shadow, like the far
    // side of the disk (point lens: image at (d + √(d² + 4θE²)) / 2).
    const lens = (x, y, pw) => {
      const E = L.R * 0.95 * lensK * clamp(pw / 0.6, 0, 1)
      if (E < 0.5) return [x, y]
      const dx = x - L.cx
      const dy = y - L.cy
      const d = Math.hypot(dx, dy) || 1e-3
      const f = (d + Math.sqrt(d * d + 4 * E * E)) / (2 * d)
      return [L.cx + dx * f, L.cy + dy * f]
    }

    const rumble = () => {
      tone(snd, { freq: 38, slideTo: 58, type: 'sine', dur: 0.8, gain: 0.3, attack: 0.25 })
      noise(snd, { dur: 0.8, gain: 0.07, freq: 180, sweepTo: 520, attack: 0.3 })
    }
    const whoom = () => {
      tone(snd, { freq: 140, slideTo: 36, type: 'sine', dur: 1.3, gain: 0.32, attack: 0.02 })
      noise(snd, { type: 'bandpass', freq: 2600, sweepTo: 160, q: 2.5, dur: 1.1, gain: 0.14, attack: 0.03 })
    }
    const whoosh = (v) => noise(snd, { type: 'bandpass', freq: 300, sweepTo: 900 + 700 * v, q: 1.8, dur: 0.4, gain: Math.min(0.16, 0.05 * v), attack: 0.02 })
    const gulp = () => {
      tone(snd, { freq: 700, slideTo: 28, type: 'sawtooth', dur: 1.1, gain: 0.07 })
      noise(snd, { freq: 5000, sweepTo: 60, dur: 1.1, gain: 0.16 })
      tone(snd, { freq: 50, slideTo: 24, type: 'sine', at: 0.9, dur: 1.4, gain: 0.4, attack: 0.02 })
    }
    const spit = () => {
      tone(snd, { freq: 60, slideTo: 1200, type: 'triangle', dur: 0.55, gain: 0.09 })
      noise(snd, { type: 'highpass', freq: 4500, dur: 0.6, gain: 0.06, attack: 0.2 })
    }

    // Gravity, plus a nudge toward the home lap (the disk's gas drag, roughly) so
    // every fling ends back in orbit; stronger where laps are faster. Well inside
    // the lap the target is a circular orbit instead, so the card can climb out.
    const step = (h) => {
      const r2 = u * u + w * w
      const r = Math.sqrt(r2)
      const g = GM / (r2 + SOFT * SOFT) ** 1.5
      let au = -u * g
      let aw = -w * g
      if (keep > 0 && r > 1e-4) {
        const { e } = L
        const p = 1 - e * e
        // true anomaly: periapsis on -u, moving toward +w (the disk's direction)
        const cosNu = -u / r
        const sinNu = w / r
        const k = smooth(0.4 * (1 - e), 0.9 * (1 - e), r)
        const vk = Math.sqrt(GM / p)
        const vc = Math.sqrt(g) * r
        const tu = (k * vk + (1 - k) * vc) * sinNu
        const tw = k * vk * (e + cosNu) + (1 - k) * vc * cosNu
        const drift = 0.7 * (p / (1 + e * cosNu) - r)
        const lam = keep * (1 + Math.hypot(tu, tw) / r)
        au += (tu + (u / r) * drift - vu) * lam
        aw += (tw + (w / r) * drift - vw) * lam
      }
      vu += au * h
      vw += aw * h
      u += vu * h
      w += vw * h
    }

    const capture = () => {
      mode = 'free'
      lastInteraction = performance.now()
      pullT = 0
      keep = 0
      // mostly sideways (prograde), a little inward: swings round the hole, then settles
      const r = Math.hypot(u, w) || 1
      vu = (w / r) * 0.45 - (u / r) * 0.1
      vw = (-u / r) * 0.45 - (w / r) * 0.1
      hintFrom = clock + 1.4
      hintUntil = clock + 6.5
      whoom()
    }
    const release = () => {
      const { id, trail, x: px, y: py } = grab
      grab = null
      if (el.hasPointerCapture?.(id)) el.releasePointerCapture(id)
      delete el.dataset.held
      lastInteraction = performance.now()
      mode = 'free'
      // let go with the held point over the shadow: in it goes
      if (Math.hypot(px - L.cx, py - L.cy) < 0.8 * L.R) return swallow(cur.x, cur.y)
      keep = Math.min(keep, 0.25)
      const end = trail[trail.length - 1]
      const start = trail.find((p) => end && end[0] - p[0] <= 0.1) ?? end
      const span = end && start ? end[0] - start[0] : 0
      vu = span > 0.01 ? (end[1] - start[1]) / span : 0
      vw = span > 0.01 ? (end[2] - start[2]) / span : 0
      const v = Math.hypot(vu, vw)
      if (v > VMAX) {
        vu *= VMAX / v
        vw *= VMAX / v
      }
      if (span > 0.01) spin += clamp(((end[3] - start[3]) / span) * 0.004, -6, 6)
      if (v > 0.5) whoosh(Math.min(v, VMAX))
    }
    const swallow = (x, y) => {
      mode = 'fall'
      modeT = 0
      fall = { d: Math.hypot(x - L.cx, y - L.cy), a: Math.atan2(y - L.cy, x - L.cx), S: cur.S }
      el.inert = true
      el.dataset.gone = ''
      gulp()
    }
    const emit = () => {
      // out of the hole toward the open sky, then back into the lap
      u = 0.1
      w = 0.03
      vu = 1.3
      vw = 0.15
      zoom = 0.05
      fade = 1
      tide = 0
      lensK = 0
      keep = 0.3
      ox = 0
      oy = 0
      mode = 'free'
      pullT = 0
      lastInteraction = performance.now()
      backUntil = clock + 4.5
      el.inert = false
      delete el.dataset.gone
      spit()
    }

    const frame = (now) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000))
      last = now
      clock += dt
      modeT += dt
      pullT += dt
      if (mode === 'free' && !grab && now - lastInteraction >= IDLE_S * 1000) swallow(cur.x, cur.y)

      let x
      let y
      let S
      if (mode === 'fall' || mode === 'gone') {
        // spiral in, stretch, shrink, gone
        const k = Math.min(1, modeT / FALL_S)
        fall.a += (3 + 12 * k) * dt
        const d = fall.d * (1 - k) ** 1.5
        x = L.cx + Math.cos(fall.a) * d
        y = L.cy + Math.sin(fall.a) * d
        S = fall.S * (1 - 0.92 * k)
        tide = 2.5 * k
        fade = 1 - k * k
        spin = 0
        tilt += 4 * dt
        if (mode === 'fall' && k >= 1) {
          mode = 'gone'
          modeT = 0
          goneAt = now
        } else if (mode === 'gone' && now - goneAt >= GONE_S * 1000) emit()
      }
      let jx = 0
      let jy = 0
      if (mode === 'tremor') {
        // the hole takes hold: shiver, lean in
        const k = Math.min(1, modeT / 0.55)
        jx = (Math.random() - 0.5) * 7 * k
        jy = (Math.random() - 0.5) * 7 * k
        tilt = (Math.random() - 0.5) * 0.04 * k
        tide = 0.1 * k
        if (k >= 1) capture()
      } else if (mode === 'held') {
        // the grabbed point stays under the pointer
        const Sh = L.b * persp(w) * zoom
        const c = Math.cos(tilt)
        const s = Math.sin(tilt)
        ;[u, w] = unproject(grab.x - (grab.lx * c - grab.ly * s) * Sh, grab.y - (grab.lx * s + grab.ly * c) * Sh)
        grab.trail.push([clock, u, w, grab.x])
        if (grab.trail.length > 10) grab.trail.shift()
        const p = grab.trail[grab.trail.length - 3]
        const pvx = p ? (grab.x - p[3]) / Math.max(1e-3, clock - p[0]) : 0
        spin += (clamp(pvx * 0.0004, -0.35, 0.35) - tilt) * 40 * dt - spin * 6 * dt
        tilt += spin * dt
        zoom = ease(zoom, 1.12, 10, dt)
        tide = ease(tide, 0, 4, dt)
      } else if (mode === 'free') {
        let left = dt
        while (left > 1e-6) {
          const h = Math.min(left, 1 / 120)
          step(h)
          left -= h
        }
        keep = Math.min(1, keep + dt / 1.2)
        lensK = ease(lensK, pullT > 0.8 ? 1 : 0, 1.6, dt)
        zoom = ease(zoom, 1, pullT < 2 ? 1.6 : 4, dt)
        tide = ease(tide, 0, 3, dt)
        fade = ease(fade, 1, 6, dt)
        // bank a little with the motion, wobble back upright
        const [px] = project(u, w)
        const [qx] = project(u + vu * 0.05, w + vw * 0.05)
        const lean = clamp(((qx - px) / 0.05) * 0.00025, -0.15, 0.15)
        spin += (lean - tilt) * 40 * dt - spin * 6 * dt
        tilt += spin * dt
      }

      if (mode !== 'fall' && mode !== 'gone') {
        const s = persp(w)
        ;[x, y] = lens(...project(u, w), w)
        S = L.b * s * zoom
        if (mode !== 'tremor') {
          ox = ease(ox, 0, pullT < 2 ? 2 : 6, dt)
          oy = ease(oy, 0, pullT < 2 ? 2 : 6, dt)
        }
        x += ox + jx
        y += oy + jy
        // dropped (or flung) onto the shadow: in it goes
        if (mode === 'free' && !grab && pullT > 1.5 && Math.hypot(u, w) < 0.3 && Math.hypot(x - L.cx, y - L.cy) < 0.45 * L.R) swallow(x, y)
      }
      render(x, y, S)

      const want = mode === 'fall' ? 'fall' : mode === 'gone' ? 'gone' : clock < backUntil ? 'back' : clock > hintFrom && clock < hintUntil ? 'hint' : null
      if (want !== shown) {
        shown = want
        setNote(want && NOTE[want])
      }
    }

    const render = (x, y, S) => {
      const dx = x - L.cx
      const dy = y - L.cy
      // tidal stretch toward the hole (eased in after the capture, so the docked sheet doesn't jolt)
      const r = Math.max(0.05, Math.hypot(u, w))
      const tidal = mode === 'held' || mode === 'fall' ? 1 : mode === 'free' ? clamp((pullT - 0.4) / 1.2, 0, 1) : 0
      const st = 1 + Math.min(1.8, 0.02 / r ** 3) * tidal + tide
      const phi = Math.atan2(dy, dx)
      const shape = `rotate(${phi}rad) scale(${st}, ${1 / Math.sqrt(st)}) rotate(${tilt - phi}rad) scale(${S})`
      const matrix = new DOMMatrix(shape)
      if (mode === 'held') {
        // Account for rotation, perspective and tidal stretching at the grab point.
        x = grab.x - (matrix.a * grab.lx + matrix.c * grab.ly)
        y = grab.y - (matrix.b * grab.lx + matrix.d * grab.ly)
      }
      el.style.transform = `translate(${x - L.cw / 2}px, ${y - L.ch / 2}px) ${shape}`
      cur = { x, y, S, matrix }
      const behind = mode === 'free' ? clamp(w / 0.3, 0, 1) * clamp((pullT - 0.8) / 1.5, 0, 1) : 0
      el.style.opacity = mode === 'gone' ? 0 : fade * (1 - 0.15 * behind)
      const proximity = 1 - smooth(1, 4, Math.hypot(x - L.cx, y - L.cy) / L.R)
      uiLens?.update({
        matrix, x, y, size: S, hole: { x: L.cx, y: L.cy, r: L.R }, cw: L.cw, ch: L.ch,
        strength: mode === 'fall' ? 1 : mode === 'gone' || mode === 'tremor' ? 0 : proximity * (0.65 + 0.35 * behind) * smooth(0.5, 2, pullT),
        fall: mode === 'fall',
        anchor: mode === 'held' ? { x: grab.lx + L.cw / 2, y: grab.ly + L.ch / 2 } : null,
      })

      // cut the shadow out of the card while it passes behind the hole
      let m = ''
      shadow = null
      if (behind > 0.01) {
        const c = Math.cos(phi)
        const s = Math.sin(phi)
        const a = (-dx * c - dy * s) / st
        const b = (dx * s - dy * c) * Math.sqrt(st)
        const sx = a * c - b * s
        const sy = a * s + b * c
        const ct = Math.cos(tilt)
        const stl = Math.sin(tilt)
        const lx = (sx * ct + sy * stl) / S + L.cw / 2
        const ly = (-sx * stl + sy * ct) / S + L.ch / 2
        const rl = (L.R * behind) / S
        const ex = Math.max(-lx, 0, lx - L.cw)
        const ey = Math.max(-ly, 0, ly - L.ch)
        if (ex * ex + ey * ey < rl * rl) {
          m = `radial-gradient(circle at ${lx}px ${ly}px, transparent ${rl - 3 / S}px, #000 ${rl + 3 / S}px)`
          shadow = { x: lx, y: ly, r: Math.max(0, rl - 3 / S) }
        }
      }
      if (m !== mask) {
        mask = m
        el.style.webkitMaskImage = m
        el.style.maskImage = m
      }
    }

    const activity = () => { lastInteraction = performance.now() }
    const sourcePoint = (x, y) => {
      const local = cur.matrix.inverse().transformPoint({ x: x - cur.x, y: y - cur.y })
      if (shadow && Math.hypot(local.x + L.cw / 2 - shadow.x, local.y + L.ch / 2 - shadow.y) < shadow.r) return null
      const source = uiLens?.sourceAt(local.x + L.cw / 2, local.y + L.ch / 2) ?? { x: local.x + L.cw / 2, y: local.y + L.ch / 2 }
      return { x: source.x - L.cw / 2, y: source.y - L.ch / 2 }
    }
    const targetAt = (local) => {
      if (!local) return null
      // SVG filters warp paint, not DOM hit regions. Look up the source pixel's
      // native target so a bent heading/button can still be dragged/clicked.
      const { a, b, c, d } = cur.matrix
      // A source pixel may be inside the native shadow mask even though its
      // bent image is visible outside it. Sample the unfiltered DOM geometry,
      // then restore the paint effects synchronously, before the next frame.
      const filter = el.style.filter
      const maskImage = el.style.maskImage
      const webkitMaskImage = el.style.webkitMaskImage
      let target
      try {
        el.style.filter = 'none'
        el.style.maskImage = 'none'
        el.style.webkitMaskImage = 'none'
        target = document.elementFromPoint(cur.x + a * local.x + c * local.y, cur.y + b * local.x + d * local.y)
      } finally {
        el.style.filter = filter
        el.style.maskImage = maskImage
        el.style.webkitMaskImage = webkitMaskImage
      }
      return target && el.contains(target) ? target : null
    }
    const onDown = (e) => {
      press = null
      dragged = false
      if (mode !== 'free' || grab || e.button > 0) return
      const local = sourcePoint(e.clientX, e.clientY)
      const target = targetAt(local)
      if (!target && !el.contains(e.target)) return
      const control = target && interactive(target)
      press = { target: control, x: e.clientX, y: e.clientY }
      if (!target) return
      activity()
      if (control) {
        if (!control.contains(e.target)) {
          e.preventDefault()
          control.focus?.({ preventScroll: true })
        }
        return
      }
      // On touch screens the body still scrolls; the heading is the drag handle.
      const draggable = e.pointerType !== 'touch' || !!target.closest?.('.result-head')
      if (draggable) {
        e.preventDefault()
        el.setPointerCapture?.(e.pointerId)
      }
      // grab point relative to the card centre, in the card's own units
      grab = { id: e.pointerId, x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, lx: local.x, ly: local.y, draggable, moved: false, trail: [] }
    }
    const onMove = (e) => {
      if (!grab || e.pointerId !== grab.id) return
      activity()
      grab.x = e.clientX
      grab.y = e.clientY
      if (grab.moved || Math.hypot(grab.x - grab.x0, grab.y - grab.y0) < 6) return
      if (!grab.draggable) {
        grab = null
        return
      }
      // picked up: fold lensing and the capture offset into the plane position so nothing jumps
      grab.moved = true
      dragged = true
      const s0 = persp(w)
      ;[u, w] = unproject(cur.x, cur.y)
      zoom *= s0 / persp(w)
      ox = 0
      oy = 0
      lensK = 0
      hintUntil = 0
      mode = 'held'
      el.dataset.held = ''
    }
    const onUp = (e) => {
      if (!grab || e.pointerId !== grab.id) return
      activity()
      if (grab.moved) return release()
      if (el.hasPointerCapture?.(grab.id)) el.releasePointerCapture(grab.id)
      grab = null
    }
    const onLostCapture = () => {
      if (grab?.moved) release()
      else grab = null
    }
    const onClick = (e) => {
      // Keyboard activation has no screen point and keeps its native behaviour.
      if (!e.detail) return
      const clicked = press
      press = null
      if (!clicked) return
      if (dragged || Math.hypot(e.clientX - clicked.x, e.clientY - clicked.y) > 6 || !clicked.target?.isConnected) {
        e.preventDefault()
        e.stopPropagation()
        return
      }
      if (!clicked.target.contains(e.target)) {
        e.preventDefault()
        e.stopPropagation()
        clicked.target.click()
      }
    }
    const onTouchStart = (e) => {
      if (!uiLens || e.touches.length !== 1 || (mode !== 'free' && mode !== 'held')) return
      const touch = e.touches[0]
      const target = targetAt(sourcePoint(touch.clientX, touch.clientY))
      // The bent heading may be painted over the scrollable body. touch-action
      // follows native hit regions, so block panning only for this visual handle.
      if (target?.closest('.result-head') && !interactive(target)) e.preventDefault()
    }
    const pointers = { pointerdown: onDown, pointermove: onMove, pointerup: onUp, pointercancel: onUp, click: onClick }
    const handlers = { lostpointercapture: onLostCapture, focusin: activity, keydown: activity, scroll: activity, wheel: activity }

    // Hand-off once the slide-up finishes: start from exactly where the sheet docked.
    const takeover = () => {
      if (mode !== 'dock') return
      clearTimeout(timer)
      const r = el.getBoundingClientRect()
      el.dataset.orbit = ''
      layout()
      const x = r.left + r.width / 2
      const y = r.top + r.height / 2
      ;[u, w] = unproject(x, y)
      zoom = 1 / (L.b * persp(w))
      const [px, py] = project(u, w)
      ox = x - px
      oy = y - py
      mode = 'tremor'
      modeT = 0
      rumble()
      for (const [type, fn] of Object.entries(pointers)) surface.addEventListener(type, fn, true)
      surface.addEventListener('touchstart', onTouchStart, { capture: true, passive: false })
      for (const [type, fn] of Object.entries(handlers)) el.addEventListener(type, fn, type === 'wheel' ? { passive: true } : undefined)
      render(x, y, 1)
      last = performance.now()
      raf = requestAnimationFrame(frame)
    }
    const onAnimEnd = (e) => {
      if (e.target === el && e.animationName === 'slide-up') takeover()
    }
    el.addEventListener('animationend', onAnimEnd)
    const timer = setTimeout(takeover, 700)
    const onResize = () => L && layout()
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(onResize) : null
    ro?.observe(el)
    if (scene) ro?.observe(scene)
    addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(timer)
      ro?.disconnect()
      removeEventListener('resize', onResize)
      el.removeEventListener('animationend', onAnimEnd)
      for (const [type, fn] of Object.entries(pointers)) surface.removeEventListener(type, fn, true)
      surface.removeEventListener('touchstart', onTouchStart, true)
      for (const [type, fn] of Object.entries(handlers)) el.removeEventListener(type, fn)
      snd?.stop()
      uiLens?.dispose()
      delete el.dataset.orbit
      delete el.dataset.held
      delete el.dataset.gone
      el.inert = false
      el.style.transform = ''
      el.style.opacity = ''
      el.style.webkitMaskImage = ''
      el.style.maskImage = ''
      setNote(null)
    }
  }, [ref, on])

  return note
}
