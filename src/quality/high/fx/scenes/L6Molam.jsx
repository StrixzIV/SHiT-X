import { useEffect, useState } from 'react'
import { rand, useCanvas } from './useCanvas.js'
import { noise, playFile, session, tone } from '../audio.js'
import { soundOn } from '../sfx.js'

// Level 6 — "ภัยพิบัติระดับหมอลำ": a military command display with radio comms.
// Drop public/fx/l6-radio.mp3 in to use your own radio track.
const fmtV = (n) => (n >= 1e6 ? n.toExponential(2) : Math.round(n).toLocaleString('en-US'))
const lines = (v) => [
  ['ALPHA-1', `ศูนย์บัญชาการ นี่อัลฟ่าวัน ตรวจพบแรงดัน ${v} โวลต์ในน้ำท่วม เปลี่ยน`],
  ['HQ', 'รับทราบ ยกระดับเป็นภัยพิบัติระดับหมอลำ ทุกหน่วยเตรียมพร้อม เปลี่ยน'],
  ['BRAVO-2', 'ลำโพงหมอลำสี่สิบแปดตู้ ลอยน้ำมาทางทิศเหนือ ยังเปิดเพลงอยู่ เปลี่ยน'],
  ['HQ', 'ทุกหน่วย ห้ามแตะน้ำ ห้ามเต้น ย้ำ ห้ามเต้น เปลี่ยน'],
  ['CHARLIE-3', 'หยุดเต้นไม่ได้ครับ เบสมันลงพอดี เปลี่ยน'],
  ['HQ', 'ขออนุมัติเรียกแม่ เปลี่ยนและจบ'],
]

export default function L6Molam({ total = 0, speed = 1 }) {
  const [log, setLog] = useState([])

  useEffect(() => {
    const script = lines(fmtV(total))
    const s = session(0.85)
    // Voices load asynchronously, so look the Thai one up at speaking time.
    const say = (text) => {
      if (typeof speechSynthesis === 'undefined' || !soundOn()) return
      const thai = speechSynthesis.getVoices().find((vo) => vo.lang?.startsWith('th'))
      if (!thai) return
      const u = new SpeechSynthesisUtterance(text)
      u.voice = thai
      u.lang = 'th-TH'
      u.rate = 1.15 * Math.min(speed, 1.6)
      u.pitch = 0.7
      speechSynthesis.speak(u)
    }
    if (s) {
      playFile(s, 'l6-radio.mp3', { loop: true }).then((ok) => {
        if (ok || !s.alive) return
        noise(s, { dur: 120, gain: 0.04, type: 'bandpass', freq: 1800, q: 0.8, loop: true, attack: 0.3 }) // static bed
        tone(s, { freq: 620, slideTo: 880, type: 'sine', dur: 2.2, gain: 0.02, at: 0.5 }) // distant siren
        s.every(() => tone(s, { freq: 620, slideTo: 880, type: 'sine', dur: 2.2, gain: 0.02 }), 4400 / speed)
        s.every(() => {
          // morse burst
          const pattern = [1, 0, 1, 1, 0, 1, 0, 0, 1]
          pattern.forEach((on, i) => on && tone(s, { freq: 760, type: 'sine', at: i * 0.07, dur: rand(i, 2) > 0.5 ? 0.12 : 0.05, gain: 0.025 }))
        }, 3100 / speed)
      })
    }
    const timers = script.map(([who, text], i) =>
      setTimeout(() => {
        setLog((l) => [...l, [who, text]])
        if (s?.alive) {
          noise(s, { dur: 0.14, gain: 0.22, type: 'bandpass', freq: 2500, q: 1.2 }) // squelch
          tone(s, { freq: 1000, type: 'sine', at: 1.1 / speed, dur: 0.08, gain: 0.05 }) // roger beep
          tone(s, { freq: 1350, type: 'sine', at: 1.19 / speed, dur: 0.08, gain: 0.05 })
        }
        say(text)
      }, (300 + i * 1500) / speed),
    )
    return () => {
      timers.forEach(clearTimeout)
      s?.stop()
      if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel()
    }
  }, [total, speed])

  // radar
  const ref = useCanvas((ctx, { w, h, t }) => {
    ctx.clearRect(0, 0, w, h)
    const R = Math.min(w, h) * 0.38
    const cx = w / 2
    const cy = h / 2
    ctx.strokeStyle = 'rgba(60,255,120,0.35)'
    ctx.lineWidth = 1
    for (let k = 1; k <= 4; k++) {
      ctx.beginPath()
      ctx.arc(cx, cy, (R * k) / 4, 0, Math.PI * 2)
      ctx.stroke()
    }
    ctx.beginPath()
    ctx.moveTo(cx - R, cy)
    ctx.lineTo(cx + R, cy)
    ctx.moveTo(cx, cy - R)
    ctx.lineTo(cx, cy + R)
    ctx.stroke()
    const a = (t * 1.6 * speed) % (Math.PI * 2)
    const g = ctx.createConicGradient ? ctx.createConicGradient(a - 0.9, cx, cy) : null
    if (g) {
      g.addColorStop(0, 'rgba(60,255,120,0)')
      g.addColorStop(0.14, 'rgba(60,255,120,0.35)')
      g.addColorStop(0.145, 'rgba(60,255,120,0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.fill()
    }
    for (let k = 0; k < 9; k++) {
      const ba = rand(k, 1) * Math.PI * 2
      const br = (0.25 + rand(k, 2) * 0.7) * R
      const since = ((a - ba) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2)
      const glow = Math.max(0, 1 - since / 2.5)
      ctx.fillStyle = `rgba(255,70,60,${0.15 + glow * 0.85})`
      ctx.beginPath()
      ctx.arc(cx + Math.cos(ba) * br, cy + Math.sin(ba) * br, 3 + glow * 3, 0, Math.PI * 2)
      ctx.fill()
    }
  })

  return (
    <div className="scene scene-molam">
      <div className="molam-stripes top" aria-hidden />
      <canvas ref={ref} className="scene-canvas overlay" aria-hidden />
      <div className="molam-title">
        <span className="molam-defcon">DEFCON หมอลำ 1 · ทุกหน่วยเตรียมรับมือ</span>
        <h2>ภัยพิบัติระดับหมอลำ</h2>
      </div>
      <ol className="molam-log" aria-live="polite">
        {log.map(([who, text], i) => (
          <li key={i}><b>[{who}]</b> {text}</li>
        ))}
      </ol>
      <div className="molam-stripes bottom" aria-hidden />
    </div>
  )
}
