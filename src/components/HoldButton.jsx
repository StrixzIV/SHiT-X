import { useRef, useState } from 'react'
import { beep } from '../fx/sfx.js'

// iOS < 13 and other old WebViews have no Pointer Events.
const HAS_POINTER = typeof window !== 'undefined' && 'PointerEvent' in window

// Press and hold to commit. Builds anticipation: it shakes harder and the
// pitch climbs the longer you hold; letting go drains it.
export default function HoldButton({ ms = 1500, onFire, children, disabled }) {
  const [p, setP] = useState(0)
  const st = useRef({ raf: 0, holding: false, p: 0, last: 0, tick: 0 })

  const loop = (now) => {
    const s = st.current
    const dt = now - (s.last || now)
    s.last = now
    s.p = Math.max(0, Math.min(1, s.p + (s.holding ? dt / ms : -dt / 400)))
    setP(s.p)
    const step = Math.floor(s.p * 12)
    if (s.holding && step > s.tick) beep(220 * 2 ** (step / 6), 0.05, 'sawtooth', 0.06)
    s.tick = step
    if (s.p >= 1) {
      s.holding = false
      s.p = 0
      s.last = 0
      setP(0)
      onFire()
      return
    }
    if (s.holding || s.p > 0) s.raf = requestAnimationFrame(loop)
    else s.last = 0
  }
  const down = (e) => {
    if (disabled || (e.type === 'keydown' && (e.repeat || (e.key !== 'Enter' && e.key !== ' ')))) return
    e.preventDefault()
    st.current.holding = true
    cancelAnimationFrame(st.current.raf)
    st.current.raf = requestAnimationFrame(loop)
  }
  const up = () => { st.current.holding = false }

  return (
    <button
      type="button"
      className="hold"
      disabled={disabled}
      style={{ '--p': p }}
      {...(HAS_POINTER
        ? { onPointerDown: down, onPointerUp: up, onPointerLeave: up, onPointerCancel: up }
        : { onTouchStart: down, onTouchEnd: up, onTouchCancel: up, onMouseDown: down, onMouseUp: up, onMouseLeave: up })}
      onKeyDown={down}
      onKeyUp={up}
      onContextMenu={(e) => e.preventDefault()}
    >
      <span className="hold-fill" />
      <span className="hold-text">{p > 0 ? `${Math.round(p * 100)}% · อย่าปล่อย!` : children}</span>
    </button>
  )
}
