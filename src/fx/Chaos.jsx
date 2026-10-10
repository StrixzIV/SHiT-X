import { useEffect, useMemo, useState } from 'react'

// Deterministic scatter so renders stay pure.
const hash = (i, k) => (((Math.sin(i * 12.9898 + k * 78.233) * 43758.5453) % 1) + 1) % 1

// Level-scaled nonsense layered over the calculation screen.
//   3+: lightning bolts and white flashes
//   4+: emoji rain
const EMOJI = ['⚡', '🔥', '💀', '🔌', '🌊', '🪫', '💸', '👑', '🧯', '⚠️']

function bolt() {
  let x = 10 + Math.random() * 80
  let y = 0
  const pts = [[x, y]]
  while (y < 100) {
    y += 5 + Math.random() * 9
    x += (Math.random() - 0.5) * 14
    pts.push([x, y])
  }
  return pts.map((p) => p.join(',')).join(' ')
}

export default function Chaos({ level }) {
  const [bolts, setBolts] = useState([])
  useEffect(() => {
    if (level < 3) return
    const t = setInterval(() => {
      const n = Math.random() < 0.55 ? (level - 2) * 2 : 0
      setBolts(Array.from({ length: n }, bolt))
    }, 160 + (5 - level) * 60)
    return () => clearInterval(t)
  }, [level])

  const rain = useMemo(
    () =>
      level < 4
        ? []
        : Array.from({ length: (level - 3) * 36 }, (_, i) => ({
            ch: EMOJI[i % EMOJI.length],
            left: hash(i, 0) * 100,
            dur: 1.4 + hash(i, 1) * 2.2,
            delay: -hash(i, 2) * 3,
            size: 18 + hash(i, 3) * 40,
          })),
    [level],
  )

  return (
    <div className="chaos" aria-hidden>
      {bolts.length > 0 && (
        <>
          <div className="bolt-flash" key={bolts[0]} />
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="bolts">
            {bolts.map((b, i) => <polyline key={i} points={b} />)}
          </svg>
        </>
      )}
      {rain.map((r, i) => (
        <span key={i} className="drop" style={{ left: `${r.left}%`, animationDuration: `${r.dur}s`, animationDelay: `${r.delay}s`, fontSize: r.size }}>
          {r.ch}
        </span>
      ))}
    </div>
  )
}
