import { useEffect, useRef, useState } from 'react'

// Split into grapheme clusters, not code points, so Thai tone marks and
// vowels (่ ้ ๊ ั ิ ุ ำ) stay attached to their base letter.
// Browsers without Intl.Segmenter (Firefox < 125, Safari < 14.1) fall back to
// gluing Thai above/below marks and sara am onto the preceding letter.
const segmenter = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter('th', { granularity: 'grapheme' }) : null
const THAI_CLUSTER = /[\s\S][\u0E31\u0E33-\u0E3A\u0E47-\u0E4E]*/g
const graphemes = (text) => (segmenter ? [...segmenter.segment(text)].map((g) => g.segment) : text.match(THAI_CLUSTER) ?? [])

// Per-letter wobble, like Balatro's floating title text.
export function WavyText({ text, className = '' }) {
  return (
    <span className={`wavy ${className}`} aria-label={text}>
      {graphemes(text).map((ch, i) => (
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
