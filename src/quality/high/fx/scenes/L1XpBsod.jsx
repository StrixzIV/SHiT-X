import { useEffect, useRef, useState } from 'react'
import { rand, useCanvas } from './useCanvas.js'
import { noise, session, tone } from '../audio.js'

// Level 1 — an XP-style blue screen (our own wording), with sparks and a bit of
// smoke. Every other burst is a big one with an 8-bit spark crackle (the only
// sound); the ones between are small, quiet fizzes.
const BURST_EVERY = 0.9

function crackle(s) {
  for (let k = 0; k < 6; k++) tone(s, { freq: 900 + Math.random() * 2600, type: 'square', at: k * 0.025, dur: 0.02 + Math.random() * 0.03, gain: 0.05 })
  noise(s, { dur: 0.06, gain: 0.12, type: 'highpass', freq: 3000 })
}

export default function L1XpBsod({ total = 0, speed = 1 }) {
  const [dump, setDump] = useState(0)
  const bursts = useRef([])
  const smoke = useRef([])
  const snd = useRef(null)

  useEffect(() => {
    const t = setInterval(() => setDump((d) => Math.min(100, d + 3 + Math.floor(Math.random() * 6))), 220 / speed)
    const s = session(0.8)
    snd.current = s
    return () => {
      clearInterval(t)
      snd.current = null
      s?.stop()
    }
  }, [speed])

  const ref = useCanvas((ctx, { w, h, t, dt }) => {
    ctx.clearRect(0, 0, w, h)
    // new burst on the beat, at a random edge-ish point
    const beat = Math.floor((t * speed) / BURST_EVERY)
    if (beat !== bursts.current.beat) {
      bursts.current.beat = beat
      const big = beat % 2 === 0
      if (big && snd.current?.alive) crackle(snd.current)
      const x = (0.1 + rand(beat, 1) * 0.8) * w
      const y = (rand(beat, 2) < 0.5 ? 0.15 + rand(beat, 3) * 0.2 : 0.7 + rand(beat, 4) * 0.25) * h
      for (let k = 0; k < (big ? 28 : 9); k++) {
        const a = rand(beat * 31 + k, 5) * Math.PI * 2
        const v = 120 + rand(beat * 31 + k, 6) * 380
        bursts.current.push({ x, y, px: x, py: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120, life: 0.45 + rand(k, beat) * 0.5 })
      }
      if (big) for (let k = 0; k < 3; k++) smoke.current.push({ x: x + (k - 1) * 14, y, r: 10, life: 2.2 })
    }
    // smoke: grey puffs drifting up
    smoke.current = smoke.current.filter((p) => (p.life -= dt) > 0)
    for (const p of smoke.current) {
      p.y -= 26 * dt
      p.r += 18 * dt
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r)
      g.addColorStop(0, `rgba(170,170,180,${0.22 * (p.life / 2.2)})`)
      g.addColorStop(1, 'rgba(170,170,180,0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
      ctx.fill()
    }
    // sparks: short bright streaks with gravity
    ctx.globalCompositeOperation = 'lighter'
    const live = bursts.current.filter((p) => (p.life -= dt) > 0)
    live.beat = bursts.current.beat
    bursts.current = live
    for (const p of live) {
      p.px = p.x
      p.py = p.y
      p.vy += 700 * dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      ctx.strokeStyle = p.life > 0.3 ? '#fff6c0' : '#ffa030'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(p.px, p.py)
      ctx.lineTo(p.x, p.y)
      ctx.stroke()
    }
    ctx.globalCompositeOperation = 'source-over'
  })

  return (
    <div className="scene scene-xp">
      <pre className="xp-text">{`iLeak ตรวจพบปัญหาร้ายแรง และได้ปิดระบบเพื่อป้องกันความเสียหายต่อน้ำท่วมของท่าน

FLOOD_WATER_IS_LIVE

หากท่านเห็นหน้าจอนี้เป็นครั้งแรก กรุณาถอดสายชาร์จออกจากคลอง
หากเห็นอีก กรุณาตรวจสอบว่าน้ำที่ท่วมเข้ามาใหม่ติดตั้งอย่างถูกต้อง
หรือสอบถามเจ้าของบ้านเรื่องการอัปเดตน้ำท่วมล่าสุด

ข้อมูลทางเทคนิค:

*** STOP: 0x00000220 (0x0000FL00D, 0x000000WET, ${'0x' + Math.round(total).toString(16).toUpperCase().padStart(8, '0').slice(-8)}, 0x00000000)

***  ileak.sys - Address 0xDEADBEEF base at 0xC0FFEE00, DateStamp 2569-10-10

กำลังถ่ายโอนหน่วยความจำลงคลอง... ${dump}%`}</pre>
      <canvas ref={ref} className="scene-canvas overlay" aria-hidden />
    </div>
  )
}
