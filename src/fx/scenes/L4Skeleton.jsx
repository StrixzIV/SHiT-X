import { useEffect } from 'react'
import { rand, useCanvas } from './useCanvas.js'
import { asset, drive, noise, playFile, session, tone, voice } from '../audio.js'

// Level 4 — the electrocuted skeleton, flickering, with a FAHHH.
// Drop the real clip in public/fx/ (any of FAHH_FILES); otherwise it's synthesized.
const FAHH_FILES = ['l4-fahh.mp3', 'fahh.mp3', 'fahhhhhhhhhhhhhh.mp3']
function fahh(s, at = 0) {
  noise(s, { at, dur: 0.16, gain: 0.32, type: 'highpass', freq: 2400 }) // "F"
  const yell = drive(s, 7)
  voice(s, { freq: 210, slideTo: 150, at: at + 0.12, dur: 1.35, gain: 0.22, attack: 0.04, vibrato: 7, formants: [760, 1220, 2650], dest: yell })
}

export default function L4Skeleton({ speed = 1 }) {
  useEffect(() => {
    const s = session(0.9)
    if (!s) return
    // electric buzz underneath
    const buzz = drive(s, 4)
    tone(s, { freq: 55, type: 'sawtooth', dur: 30, gain: 0.05, attack: 0.05, dest: buzz })
    tone(s, { freq: 110, type: 'square', dur: 30, gain: 0.025, attack: 0.05, dest: buzz })
    s.every(() => noise(s, { dur: 0.05, gain: 0.08, type: 'bandpass', freq: 3000 + Math.random() * 3000, q: 3 }), 140)
    // FAHH twice: at the cut and again ~2.6 s in (the real clip if present).
    playFile(s, FAHH_FILES).then((ok) => {
      if (!s.alive) return
      if (ok) return s.later(() => playFile(s, FAHH_FILES), 2600 / speed)
      fahh(s)
      s.later(() => fahh(s), 2600 / speed)
    })
    return () => s.stop()
  }, [speed])

  // purple arcs crawling over the image
  const ref = useCanvas((ctx, { w, h, t }) => {
    ctx.clearRect(0, 0, w, h)
    const frame = Math.floor(t * 14)
    ctx.globalCompositeOperation = 'lighter'
    for (let k = 0; k < 4; k++) {
      if (rand(frame, k) < 0.45) continue
      let x = rand(frame * 3 + k, 1) * w
      let y = rand(frame * 3 + k, 2) * h
      ctx.strokeStyle = `rgba(${200 + rand(frame, k + 5) * 55},140,255,0.9)`
      ctx.lineWidth = 1.5 + rand(frame, k + 7) * 2
      ctx.shadowColor = '#c084fc'
      ctx.shadowBlur = 12
      ctx.beginPath()
      ctx.moveTo(x, y)
      for (let i = 0; i < 9; i++) {
        x += (rand(frame * 11 + k * 7 + i, 3) - 0.5) * w * 0.12
        y += (rand(frame * 11 + k * 7 + i, 4) - 0.5) * h * 0.12
        ctx.lineTo(x, y)
      }
      ctx.stroke()
    }
    ctx.shadowBlur = 0
    ctx.globalCompositeOperation = 'source-over'
  })

  return (
    <div className="scene scene-skeleton">
      <img className="skeleton-img" src={asset('skeleton.png')} alt="โครงกระดูกโดนไฟช็อต" />
      <canvas ref={ref} className="scene-canvas overlay" aria-hidden />
    </div>
  )
}
