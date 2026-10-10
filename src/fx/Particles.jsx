import { useMemo } from 'react'
import { rand, useCanvas } from './scenes/useCanvas.js'

// Loading screen: black, with white motes drifting slowly around the centre.
const COUNT = 110

export default function Particles() {
  const motes = useMemo(
    () =>
      Array.from({ length: COUNT }, (_, i) => ({
        a: rand(i, 1) * Math.PI * 2,
        r: Math.sqrt(rand(i, 2)) * 0.32,
        speed: 0.02 + rand(i, 3) * 0.05,
        wobble: 0.6 + rand(i, 4) * 1.6,
        size: 0.6 + rand(i, 5) ** 2 * 2.4,
        phase: rand(i, 6) * Math.PI * 2,
      })),
    [],
  )

  const ref = useCanvas((ctx, { w, h, t }) => {
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, w, h)
    const cx = w / 2
    const cy = h / 2
    const R = Math.min(w, h)
    ctx.globalCompositeOperation = 'lighter'
    for (const m of motes) {
      const a = m.a + t * m.speed
      const r = m.r * R * (1 + 0.08 * Math.sin(t * 0.3 * m.wobble + m.phase))
      const x = cx + Math.cos(a) * r + Math.sin(t * 0.4 * m.wobble + m.phase) * 6
      const y = cy + Math.sin(a) * r * 0.7 + Math.cos(t * 0.35 * m.wobble + m.phase) * 6
      const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * m.wobble + m.phase))
      const g = ctx.createRadialGradient(x, y, 0, x, y, m.size * 4)
      g.addColorStop(0, `rgba(255,255,255,${0.9 * tw})`)
      g.addColorStop(0.35, `rgba(220,230,255,${0.25 * tw})`)
      g.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(x, y, m.size * 4, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalCompositeOperation = 'source-over'
  })

  return <canvas ref={ref} className="scene-canvas" aria-hidden />
}
