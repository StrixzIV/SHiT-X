import { useEffect, useRef, useState } from 'react'
import { useCanvas } from './useCanvas.js'
import { loadImage, noise, playFile, sequence, session, tone } from '../audio.js'
import { beep } from '../sfx.js'
import { HOENN_BATTLE_SCORE } from './sceneAudio.js'

// Level 5 — a GBA-style wild battle. Original creature + a short opening of
// Ruby/Sapphire/Emerald's wild-battle theme, played with browser synth voices.
// To use your own, drop public/fx/l5-opponent.png (sprite) and/or l5-battle.mp3,
// and rename the opponent here.
const OPPONENT = 'PLUGCHU'
const GBA = [240, 160]

const SCRIPT = [
  [1900, `${OPPONENT} ป่า ปรากฏตัว!`],
  [3400, 'ไปเลย! มือถือของท่าน!'],
  [4900, 'มือถือของท่าน ใช้ THUNDER!'],
  [6900, 'ได้ผลไม่ค่อยดี...'],
  [8300, `${OPPONENT} ดูดไฟ 220V จากน้ำท่วม!`],
  [9800, `${OPPONENT} ใช้ THUNDER!`],
  [11800, 'มือถือของท่าน หมดสภาพ!'],
]

function plugchu(ctx, x, y) {
  const o = '#604800'
  ctx.fillStyle = o
  ctx.fillRect(x - 11, y - 39, 6, 12)
  ctx.fillRect(x + 5, y - 39, 6, 12)
  ctx.fillStyle = '#c8c8d0'
  ctx.fillRect(x - 10, y - 38, 4, 10)
  ctx.fillRect(x + 6, y - 38, 4, 10)
  // cable tail ending in a bolt
  ctx.strokeStyle = o
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(x + 14, y - 10)
  ctx.lineTo(x + 24, y - 15)
  ctx.lineTo(x + 21, y - 23)
  ctx.lineTo(x + 30, y - 28)
  ctx.stroke()
  ctx.strokeStyle = '#f8d030'
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.fillStyle = '#f8d030'
  ctx.beginPath()
  ctx.moveTo(x + 29, y - 36)
  ctx.lineTo(x + 35, y - 30)
  ctx.lineTo(x + 31, y - 29)
  ctx.lineTo(x + 34, y - 22)
  ctx.lineTo(x + 27, y - 29)
  ctx.lineTo(x + 31, y - 30)
  ctx.closePath()
  ctx.fill()
  // body
  ctx.fillStyle = o
  ctx.fillRect(x - 16, y - 29, 32, 27)
  ctx.fillStyle = '#f8d030'
  ctx.fillRect(x - 15, y - 28, 30, 25)
  ctx.fillStyle = '#fff090'
  ctx.fillRect(x - 13, y - 26, 10, 3)
  // outlet-slot eyes and mouth
  ctx.fillStyle = '#202020'
  ctx.fillRect(x - 8, y - 22, 2, 6)
  ctx.fillRect(x + 6, y - 22, 2, 6)
  ctx.fillRect(x - 3, y - 12, 6, 2)
  ctx.fillRect(x - 4, y - 13, 1, 1)
  ctx.fillRect(x + 3, y - 13, 1, 1)
  // feet
  ctx.fillStyle = o
  ctx.fillRect(x - 12, y - 3, 8, 3)
  ctx.fillRect(x + 4, y - 3, 8, 3)
}

function phoneBack(ctx, x, y) {
  ctx.fillStyle = '#18181c'
  ctx.fillRect(x - 15, y - 47, 30, 47)
  ctx.fillStyle = '#3a3a44'
  ctx.fillRect(x - 14, y - 46, 28, 45)
  ctx.fillStyle = '#4c4c58'
  ctx.fillRect(x - 13, y - 45, 4, 43)
  // camera module
  ctx.fillStyle = '#202026'
  ctx.fillRect(x - 11, y - 43, 12, 12)
  ctx.fillStyle = '#0c0c10'
  ctx.fillRect(x - 10, y - 42, 4, 4)
  ctx.fillRect(x - 5, y - 42, 4, 4)
  ctx.fillRect(x - 10, y - 37, 4, 4)
  ctx.fillStyle = '#7080ff'
  ctx.fillRect(x - 9, y - 41, 1, 1)
  ctx.fillRect(x - 4, y - 41, 1, 1)
  ctx.fillRect(x - 9, y - 36, 1, 1)
  // bolt logo
  ctx.fillStyle = '#f8d030'
  ctx.fillRect(x, y - 26, 3, 5)
  ctx.fillRect(x - 2, y - 22, 5, 2)
  ctx.fillRect(x - 2, y - 20, 3, 5)
}

function hpBar(ctx, x, y, w, hp) {
  ctx.fillStyle = '#404040'
  ctx.fillRect(x - 1, y - 1, w + 2, 6)
  ctx.fillStyle = '#d0d0c0'
  ctx.fillRect(x, y, w, 4)
  ctx.fillStyle = hp > 0.5 ? '#40c860' : hp > 0.2 ? '#f8c830' : '#f04030'
  ctx.fillRect(x, y, Math.round(w * Math.max(0, hp)), 4)
}

function strikeBolt(ctx, tx, ty, seed) {
  let x = tx + ((seed * 37) % 11) - 5
  let y = 0
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(x, y)
  for (let i = 1; i <= 8; i++) {
    y = (ty * i) / 8
    x = tx + Math.sin(seed * 3.1 + i * 2.3) * 8
    ctx.lineTo(x, y)
  }
  ctx.stroke()
  ctx.strokeStyle = '#f8e050'
  ctx.lineWidth = 1
  ctx.stroke()
}

export default function L5Battle({ speed = 1 }) {
  const [phase, setPhase] = useState('flash') // flash → bars → battle
  const [msg, setMsg] = useState('')
  const [typed, setTyped] = useState(0)
  const st = useRef({ tw: {}, v: { opp: 1, plr: -1, oppHp: 1, plrHp: 1, faint: 0, glow: 0 }, strike: null })
  const oppImg = useRef(null)

  useEffect(() => {
    loadImage(['l5-opponent.png', 'l5-opponent.jpg', 'l5-opponent.webp'], (im) => {
      oppImg.current = im
    })
  }, [])

  useEffect(() => {
    const at = (ms, fn) => setTimeout(fn, ms / speed)
    const tw = (key, to, ms) => {
      const now = performance.now()
      st.current.tw[key] = { from: st.current.v[key], to, start: now, dur: ms / speed }
    }
    const s = session(0.85)
    const music = s ? session(0.75) : null
    // The actual battle opening spans the flash/wipe and continues into battle.
    // A supplied track already includes its intro, so it replaces the whole score.
    if (music) playFile(music, 'l5-battle.mp3', { loop: true, gain: 0.7 }).then((ok) => {
      if (ok || !music.alive) return
      sequence(music, { ...HOENN_BATTLE_SCORE, bpm: HOENN_BATTLE_SCORE.bpm * speed })
    })
    if (s) {
      noise(s, { at: 0.6 / speed, dur: 0.6 / speed, gain: 0.1, type: 'bandpass', freq: 600, sweepTo: 5000 })
    }
    const timers = [
      at(600, () => setPhase('bars')),
      at(1300, () => {
        setPhase('battle')
        tw('opp', 0, 600)
        tw('plr', 0, 600)
      }),
      ...SCRIPT.map(([ms, text]) => at(ms, () => {
        setMsg(text)
        setTyped(0)
      })),
      // your THUNDER on the opponent
      at(5500, () => {
        st.current.strike = { who: 'opp', start: performance.now() }
        tw('oppHp', 0.9, 500)
        if (s) {
          noise(s, { dur: 0.45, gain: 0.4, type: 'highpass', freq: 2200, sweepTo: 300 })
          for (let k = 0; k < 3; k++) tone(s, { freq: 1400, slideTo: 180, type: 'square', at: k * 0.1, dur: 0.12, gain: 0.06 })
        }
      }),
      // it soaks up the flood
      at(8300, () => {
        tw('glow', 1, 300)
        tw('oppHp', 1, 900)
        if (s) tone(s, { freq: 300, slideTo: 1200, type: 'square', dur: 0.9, gain: 0.05 })
      }),
      at(9300, () => tw('glow', 0, 400)),
      // its THUNDER on you
      at(10400, () => {
        st.current.strike = { who: 'plr', start: performance.now() }
        tw('plrHp', 0, 1100)
        if (s) {
          noise(s, { dur: 0.5, gain: 0.45, type: 'highpass', freq: 2000, sweepTo: 250 })
          for (let k = 0; k < 4; k++) tone(s, { freq: 1300, slideTo: 150, type: 'square', at: k * 0.09, dur: 0.12, gain: 0.06 })
          for (let k = 0; k < 14; k++) tone(s, { freq: 880, type: 'square', at: 0.4 + k * 0.075, dur: 0.03, gain: 0.03 })
        }
      }),
      at(11800, () => {
        tw('faint', 1, 700)
        music?.stop()
        if (s) tone(s, { freq: 620, slideTo: 60, type: 'pulse', duty: 0.25, dur: 0.7 / speed, gain: 0.065 })
      }),
    ]
    return () => {
      timers.forEach(clearTimeout)
      s?.stop()
      music?.stop()
    }
  }, [speed])

  // typewriter + text blips
  useEffect(() => {
    if (!msg || typed >= msg.length) return
    const t = setTimeout(() => {
      if (typed % 4 === 0) beep(1650, 0.025, 'square', 0.025)
      setTyped((n) => Math.min(msg.length, n + 2))
    }, 32 / speed)
    return () => clearTimeout(t)
  }, [msg, typed, speed])

  const ref = useCanvas(
    (ctx) => {
      const now = performance.now()
      const S = st.current
      for (const [k, a] of Object.entries(S.tw)) {
        const p = Math.min(1, (now - a.start) / a.dur)
        S.v[k] = a.from + (a.to - a.from) * p
        if (p >= 1) delete S.tw[k]
      }
      const v = S.v
      ctx.imageSmoothingEnabled = false
      // field
      ctx.fillStyle = '#f0f0d0'
      ctx.fillRect(0, 0, 240, 160)
      ctx.fillStyle = '#d8ecb0'
      ctx.fillRect(0, 48, 240, 112)
      ctx.fillStyle = '#c8e098'
      for (let i = 0; i < 240; i += 16) ctx.fillRect(i, 48, 8, 2)
      // platforms
      for (const [cx, cy, rx, ry] of [[176, 72, 46, 10], [62, 118, 54, 12]]) {
        ctx.fillStyle = '#589038'
        ctx.beginPath()
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#88c058'
        ctx.beginPath()
        ctx.ellipse(cx, cy - 2, rx - 3, ry - 3, 0, 0, Math.PI * 2)
        ctx.fill()
      }
      const strike = S.strike && now - S.strike.start < 600 / speed ? S.strike : null
      const blink = strike && Math.floor((now - strike.start) / 60) % 2 === 0
      // opponent
      const ox = 176 + v.opp * 90
      if (v.glow > 0) {
        const g = ctx.createRadialGradient(ox, 50, 2, ox, 50, 34)
        g.addColorStop(0, `rgba(255,240,120,${0.8 * v.glow})`)
        g.addColorStop(1, 'rgba(255,240,120,0)')
        ctx.fillStyle = g
        ctx.fillRect(ox - 40, 10, 80, 80)
      }
      if (!(blink && strike.who === 'opp')) {
        const im = oppImg.current
        if (im) ctx.drawImage(im, ox - 22, 72 - 44, 44, 44)
        else plugchu(ctx, ox, 72)
      }
      // player (sinks out on faint)
      const px = 62 - v.plr * 90
      if (!(blink && strike.who === 'plr')) {
        ctx.save()
        ctx.beginPath()
        ctx.rect(0, 0, 240, 122)
        ctx.clip()
        phoneBack(ctx, px, 120 + v.faint * 60)
        ctx.restore()
      }
      // the strike
      if (strike && now - strike.start < 260 / speed) {
        const tgt = strike.who === 'opp' ? [ox, 50] : [px, 96]
        ctx.fillStyle = 'rgba(255,255,255,0.55)'
        ctx.fillRect(0, 0, 240, 160)
        strikeBolt(ctx, tgt[0], tgt[1], Math.floor((now - strike.start) / 40))
      }
      // HP boxes
      ctx.font = '8px "Press Start 2P", monospace'
      ctx.textBaseline = 'top'
      ctx.fillStyle = '#404040'
      ctx.fillRect(6, 8, 118, 30)
      ctx.fillStyle = '#f8f8e0'
      ctx.fillRect(7, 9, 116, 28)
      ctx.fillStyle = '#303030'
      ctx.fillText(OPPONENT, 12, 13)
      ctx.fillText('Lv220', 78, 13)
      ctx.fillStyle = '#f87800'
      ctx.fillText('HP', 14, 26)
      hpBar(ctx, 34, 27, 82, v.oppHp)

      ctx.fillStyle = '#404040'
      ctx.fillRect(126, 78, 108, 38)
      ctx.fillStyle = '#f8f8e0'
      ctx.fillRect(127, 79, 106, 36)
      ctx.fillStyle = '#303030'
      ctx.fillText('PHONE', 132, 83)
      ctx.fillText('Lv5', 204, 83)
      ctx.fillStyle = '#f87800'
      ctx.fillText('HP', 134, 96)
      hpBar(ctx, 154, 97, 72, v.plrHp)
      ctx.fillStyle = '#303030'
      ctx.fillText(`${String(Math.ceil(v.plrHp * 20)).padStart(2, ' ')}/ 20`, 168, 105)
    },
    { fixed: GBA },
  )

  return (
    <div className="scene scene-gba">
      <div className="gba">
        <canvas ref={ref} className="pixel-canvas" aria-label={`ต่อสู้กับ ${OPPONENT}`} />
        <div className="gba-text">{msg.slice(0, typed)}</div>
        {phase !== 'battle' && (
          <div className={`gba-trans ${phase}`} aria-hidden>
            {phase === 'bars' && Array.from({ length: 8 }, (_, i) => <span key={i} style={{ '--i': i }} />)}
          </div>
        )}
      </div>
    </div>
  )
}
