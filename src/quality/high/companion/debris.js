import { useEffect, useMemo } from 'react'
import { shot } from '../fx/scenes/gargantua.js'
import { nudge, syncSurroundings } from './brain.js'

const TAU = Math.PI * 2
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x))
const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x) }

function createMotion() {
  const items = new Map()
  let observer = null
  return {
    items,
    observeWith(next) {
      observer = next
      for (const item of items.values()) observer?.observe(item.el)
    },
    add(id, el, kind) {
      const seed = kind === 'buddy' ? 9 : Number(id) + 30
      const item = { id, el, kind, seed, born: performance.now() + Math.min(items.size, 6) * 80,
        width: el.offsetWidth, height: el.offsetHeight, x: 0, y: 0, scale: 1, angle: 0,
        ox: 0, oy: 0, vx: 0, vy: 0 }
      items.set(id, item)
      observer?.observe(el)
      return () => {
        observer?.unobserve(el)
        if (items.get(id) === item) items.delete(id)
      }
    },
  }
}

// One animation loop for all the live HTML windows. Each has its own ellipse,
// phase, speed and spin; none is parented to the result or stops on hover/focus.
export function useDebrisMotion(ref) {
  const motion = useMemo(() => createMotion(), [])

  useEffect(() => {
    const root = ref.current
    if (!root) return
    const scene = root.closest('.calc')?.querySelector('.scene-gargantua')
    const media = matchMedia('(prefers-reduced-motion: reduce)')
    let layout
    let raf = 0
    let last = performance.now()
    let grab = null
    let skipClick = false
    let clickTimer
    const measure = () => {
      const r = scene?.getBoundingClientRect() ?? { left: 0, top: 0, width: innerWidth, height: innerHeight }
      const h = shot(r.width, r.height)
      layout = { left: r.left, top: r.top, width: r.width, height: r.height,
        cx: r.left + h.x, cy: r.top + h.y, radius: h.r }
      for (const item of motion.items.values()) {
        item.width = item.el.offsetWidth
        item.height = item.el.offsetHeight
      }
    }
    const orbit = (item, age) => {
      const { seed, kind } = item
      const tx = layout.left + layout.width * (kind === 'buddy' ? .56 : .3 + .6 * hash(seed))
      const ty = layout.top + layout.height * (kind === 'buddy' ? .22 : .12 + .43 * hash(seed + 1))
      const turn = Math.atan2(ty - layout.cy, tx - layout.cx)
      const far = Math.hypot(tx - layout.cx, ty - layout.cy)
      const near = Math.min(layout.radius * (.6 + .4 * hash(seed + 2)), far * .55)
      const a = (far + near) / 2
      const e = (far - near) / (far + near)
      const b = Math.sqrt(far * near) * (.25 + .3 * hash(seed + 3))
      const phase = hash(seed + 4) * TAU + age * TAU / (17 + 16 * hash(seed + 5))
      const u = a * (e + Math.cos(phase)), v = b * Math.sin(phase)
      return { x: layout.cx + u * Math.cos(turn) - v * Math.sin(turn),
        y: layout.cy + u * Math.sin(turn) + v * Math.cos(turn),
        scale: (kind === 'buddy' ? .86 : .56 + .22 * hash(seed + 6)) * (.9 + .1 * Math.cos(phase)),
        angle: Math.sin(phase * .7 + seed) * .22 + (kind === 'toast' ? age * (.035 + .05 * hash(seed + 7)) : 0),
        behind: Math.sin(phase) > 0 }
    }
    const paint = (item, x, y, scale, angle, opacity, stretch, behind, mode) => {
      const { el, width, height } = item
      item.x = x; item.y = y; item.scale = scale; item.angle = angle
      el.style.transform = `translate(${x - width / 2}px, ${y - height / 2}px) rotate(${angle}rad) scale(${scale * stretch}, ${scale / Math.sqrt(stretch)})`
      el.style.opacity = opacity
      el.style.zIndex = item.kind === 'buddy' ? 40 : behind ? 1 : 20
      if (el.inert !== (opacity < .05)) el.inert = opacity < .05
      if (el.dataset.flight !== mode) {
        const previous = el.dataset.flight
        el.dataset.flight = mode
        if (item.kind === 'buddy') {
          syncSurroundings()
          if (mode === 'gone') nudge('l7:swallow', { subject: 'buddy', note: 'YOUR Messenger window is inside the black hole; you can still shout through it even though nobody can see you' }, 2)
          if (previous === 'spit' && mode === 'orbit') nudge('l7:spit', { subject: 'buddy', note: 'YOUR Messenger window has emerged from the black hole and is visible in its own orbit again; the result card has a separate orbit' }, 2)
        }
      }
      let mask = ''
      if (behind && scale > .01) {
        const dx = layout.cx - x, dy = layout.cy - y
        const lx = (dx * Math.cos(angle) + dy * Math.sin(angle)) / scale + width / 2
        const ly = (-dx * Math.sin(angle) + dy * Math.cos(angle)) / scale + height / 2
        const radius = layout.radius / scale
        mask = `radial-gradient(circle at ${lx}px ${ly}px, transparent ${Math.max(0, radius - 2)}px, #000 ${radius + 2}px)`
      }
      el.style.maskImage = mask
      el.style.webkitMaskImage = mask
    }
    const frame = (now) => {
      const dt = Math.min(.05, Math.max(0, (now - last) / 1000)); last = now
      for (const item of motion.items.values()) {
        const age = Math.max(0, (now - item.born) / 1000)
        const target = orbit(item, Math.max(0, age - 1.65))
        let { x, y, scale, angle, behind } = target
        let opacity = behind ? .85 : 1, stretch = 1, mode = 'orbit'
        if (age < 1.3) {
          const k = age / 1.3
          const sx = innerWidth - 12 - item.width / 2
          const sy = innerHeight - 12 - item.height / 2
          const d = Math.hypot(sx - layout.cx, sy - layout.cy) * (1 - k) ** 1.6
          const a = Math.atan2(sy - layout.cy, sx - layout.cx) - k * k * 1.1
          x = layout.cx + Math.cos(a) * d; y = layout.cy + Math.sin(a) * d
          scale = 1 - .97 * k; angle = a; stretch = 1 + 2 * k
          opacity = 1 - clamp((k - .7) / .3, 0, 1); behind = false; mode = 'pull'
        } else if (age < 1.65) {
          x = layout.cx; y = layout.cy; scale = .03; opacity = 0; mode = 'gone'
        } else if (age < 2.55) {
          const k = 1 - (1 - (age - 1.65) / .9) ** 3
          x = layout.cx + (x - layout.cx) * k; y = layout.cy + (y - layout.cy) * k
          scale *= .025 + .975 * k; opacity *= k; behind = false; mode = 'spit'
        }
        if (grab?.item === item && grab.moved) {
          x = grab.x - grab.dx; y = grab.y - grab.dy
          scale = grab.scale; angle = grab.angle; behind = false; mode = 'held'
        } else {
          item.vx += (-item.ox * 3 - item.vx * 2.5) * dt
          item.vy += (-item.oy * 3 - item.vy * 2.5) * dt
          item.ox += item.vx * dt; item.oy += item.vy * dt
          x += item.ox; y += item.oy
        }
        paint(item, x, y, scale, angle, opacity, stretch, behind, mode)
      }
      raf = requestAnimationFrame(frame)
    }
    const onDown = (e) => {
      if (media.matches || e.button > 0 || e.target.closest('button, a, input') || !e.target.closest('.cp-title, .cp-toast-bar')) return
      const el = e.target.closest('.cp-drifter')
      const item = el && motion.items.get(el.dataset.spaceId)
      if (!item || item.el.inert || item.el.dataset.flight !== 'orbit') return
      e.preventDefault()
      el.setPointerCapture(e.pointerId)
      grab = { item, id: e.pointerId, x: e.clientX, y: e.clientY, startX: e.clientX, startY: e.clientY,
        dx: e.clientX - item.x, dy: e.clientY - item.y, scale: item.scale, angle: item.angle,
        moved: false, time: performance.now(), vx: 0, vy: 0 }
    }
    const onMove = (e) => {
      if (!grab || grab.id !== e.pointerId) return
      const now = performance.now(), dt = Math.max(.008, (now - grab.time) / 1000)
      grab.vx = clamp((e.clientX - grab.x) / dt, -900, 900)
      grab.vy = clamp((e.clientY - grab.y) / dt, -900, 900)
      grab.x = e.clientX; grab.y = e.clientY; grab.time = now
      grab.moved ||= Math.hypot(grab.x - grab.startX, grab.y - grab.startY) > 5
    }
    const onUp = (e) => {
      if (!grab || grab.id !== e.pointerId) return
      const held = grab; grab = null
      if (held.item.el.hasPointerCapture(e.pointerId)) held.item.el.releasePointerCapture(e.pointerId)
      if (!held.moved) return
      const age = Math.max(0, (performance.now() - held.item.born) / 1000 - 1.65)
      const target = orbit(held.item, age)
      held.item.ox = held.item.x - target.x; held.item.oy = held.item.y - target.y
      held.item.vx = held.vx; held.item.vy = held.vy
      skipClick = true
      clearTimeout(clickTimer); clickTimer = setTimeout(() => { skipClick = false }, 250)
      if (held.item.kind === 'buddy') nudge('l7:fling', { subject: 'buddy', note: 'the user flung your own Messenger window through the orbiting MSN bubbles' }, 1)
    }
    const onClick = (e) => {
      if (skipClick && e.detail) { e.preventDefault(); e.stopPropagation(); skipClick = false }
    }
    const reset = () => {
      cancelAnimationFrame(raf)
      grab = null
      for (const item of motion.items.values()) {
        item.el.style.transform = ''; item.el.style.opacity = ''; item.el.style.maskImage = ''; item.el.style.webkitMaskImage = ''
        item.el.inert = false; item.el.dataset.flight = 'still'
      }
      if (!media.matches) { measure(); last = performance.now(); raf = requestAnimationFrame(frame) }
    }
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null
    ro?.observe(root)
    if (scene) ro?.observe(scene)
    motion.observeWith(ro)
    measure(); reset()
    const handlers = { pointerdown: onDown, pointermove: onMove, pointerup: onUp, pointercancel: onUp, click: onClick }
    for (const [type, fn] of Object.entries(handlers)) root.addEventListener(type, fn, true)
    media.addEventListener?.('change', reset)
    window.addEventListener('resize', measure)
    return () => {
      cancelAnimationFrame(raf); clearTimeout(clickTimer); ro?.disconnect()
      for (const [type, fn] of Object.entries(handlers)) root.removeEventListener(type, fn, true)
      media.removeEventListener?.('change', reset)
      window.removeEventListener('resize', measure)
      motion.observeWith(null)
    }
  }, [motion, ref])
  return motion
}
