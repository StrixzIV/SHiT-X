import { useEffect, useMemo } from 'react'
import { rand, useCanvas } from './useCanvas.js'
import { asset, playFile, reverb, session, tone, voice } from '../audio.js'

// Level 2 — hard cut to heaven: the stairway image, rays, sparkles, and a choir.
const CHORDS = [
  [50, 62, 66, 69], // D
  [55, 62, 67, 71], // G/D
  [57, 64, 69, 73], // A
  [50, 62, 66, 69], // D
]
const hz = (m) => 440 * 2 ** ((m - 69) / 12)

export default function L2Heaven() {
  useEffect(() => {
    const s = session(0.85)
    if (!s) return
    playFile(s, 'l2-heaven.mp3').then((ok) => {
      if (ok || !s.alive) return
      const room = reverb(s, 4, 2.2, 0.7)
      // harp glissando on the cut
      ;[62, 66, 69, 74, 78, 81, 86].forEach((m, i) => tone(s, { freq: hz(m), type: 'sine', at: i * 0.07, dur: 1.6, gain: 0.05, dest: room }))
      // choir: one sustained "ahh" chord every 3 s
      CHORDS.forEach((chord, c) =>
        chord.forEach((m, i) => voice(s, { freq: hz(m), at: 0.2 + c * 3, dur: 3.6, gain: i === 0 ? 0.05 : 0.035, attack: 0.9, dest: room })),
      )
    })
    return () => s.stop()
  }, [])

  const motes = useMemo(() => Array.from({ length: 50 }, (_, i) => ({ x: rand(i, 1), y: rand(i, 2), s: 1 + rand(i, 3) * 2.5, v: 0.01 + rand(i, 4) * 0.03, p: rand(i, 5) * 6.28 })), [])
  const ref = useCanvas((ctx, { w, h, t }) => {
    ctx.clearRect(0, 0, w, h)
    ctx.globalCompositeOperation = 'lighter'
    for (const m of motes) {
      const x = (m.x + Math.sin(t * 0.3 + m.p) * 0.02) * w
      const y = (((m.y - t * m.v) % 1) + 1) % 1 * h
      const a = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.5 + m.p))
      ctx.fillStyle = `rgba(255,255,255,${a})`
      ctx.beginPath()
      ctx.arc(x, y, m.s, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalCompositeOperation = 'source-over'
  })

  return (
    <div className="scene scene-heaven">
      <img className="heaven-img" src={asset('heaven.jpg')} alt="บันไดสู่สวรรค์" />
      <div className="heaven-rays" aria-hidden />
      <canvas ref={ref} className="scene-canvas overlay" aria-hidden />
    </div>
  )
}
