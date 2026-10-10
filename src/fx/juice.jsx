import { useEffect, useRef, useState } from 'react'

// Per-letter wobble, like Balatro's floating title text.
export function WavyText({ text, className = '' }) {
  return (
    <span className={`wavy ${className}`} aria-label={text}>
      {[...text].map((ch, i) => (
        <span key={i} aria-hidden style={{ animationDelay: `${i * -0.09}s` }}>
          {ch === ' ' ? ' ' : ch}
        </span>
      ))}
    </span>
  )
}

// Number that tweens to its target and "pops" whenever it changes.
export function CountUp({ value, ms = 600, className = '', format = (v) => v.toLocaleString('en-US') }) {
  const [shown, setShown] = useState(value)
  const from = useRef(value)
  useEffect(() => {
    const start = performance.now()
    const a = from.current
    let raf
    const tick = (now) => {
      const p = Math.min(1, (now - start) / ms)
      const v = Math.round(a + (value - a) * (1 - (1 - p) ** 3))
      setShown(v)
      from.current = v
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, ms])
  return (
    <span key={value} className={`pop ${className}`}>
      {format(shown)}
    </span>
  )
}
