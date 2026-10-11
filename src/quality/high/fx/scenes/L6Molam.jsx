import { useEffect, useMemo, useRef } from 'react'
import { useCanvas, rand } from './useCanvas.js'
import { noise, playFile, session } from '../audio.js'
import { codecConnect, codecRing, codecSquelch, codecText } from './sceneAudio.js'
import { soundOn } from '../sfx.js'
import { useRetro } from '../../retro.js'

// Level 6 — "ภัยพิบัติระดับหมอลำ" as a Codec call (our own take on the PS-era
// spy-game radio screen): two pixel portraits, a frequency readout, and a typed
// conversation. Drawn on a 4:3 canvas at console resolution (PS1 320×240, PS2
// 597×448). Drop public/fx/l6-radio.mp3 in to replace the static bed.
const RES = { ps1: [320, 240], ps2: [597, 448] }
const FONT = "Tahoma, 'Noto Sans Thai', 'Leelawadee UI', sans-serif"
const CPS = 22 // typing speed, graphemes per second
const CONNECT = 1.1
const PAL = { K: '#021208', D: '#0d4a26', M: '#2f9a55', L: '#6ee68f', W: '#c8ffd7' }

const fmtV = (n) => (n >= 1e6 ? n.toExponential(2) : Math.round(n).toLocaleString('en-US'))
const script = (v) => [
  ['ผู้การ', 'ท่าน ได้ยินไหม? นี่ผู้การ เปลี่ยน'],
  ['ท่าน', 'ได้ยินครับ น้ำท่วมถึงเข่าแล้วครับ'],
  ['ผู้การ', `เครื่องวัดอ่านได้ ${v} โวลต์ นี่คือภัยพิบัติระดับหมอลำ!`],
  ['ท่าน', 'ลำโพงหมอลำสี่สิบแปดตู้ลอยมาทางเหนือ ยังเปิดเพลงอยู่ครับ'],
  ['ผู้การ', 'ห้ามเต้น ย้ำ ห้ามเต้น... ขออนุมัติเรียกแม่ เปลี่ยนและจบ'],
]

// 24 × 28 portraits, one character per pixel (PAL keys; '.' = background)
const ME = [
  '........LLLLLLLL........',
  '......LLWWWWWWWWLL......',
  '.....LWWWWWWWWWWWWL.....',
  '....LWWWWWWWWWWWWWWL....',
  '....LLLLLLLLLLLLLLLL....',
  '..DDDDDDDDDDDDDDDDDDDD..',
  '.....MMMMMMMMMMMMMM.....',
  '....MMMMMMMMMMMMMMMM....',
  '....MDDDMMMMMMMMDDDM....',
  '....MMKKMMMMMMMMKKMM....',
  '....MMKKMMMMMMMMKKMM....',
  '....MMMMMMMLMMMMMMMM....',
  '....MMMMMMMLLMMMMMMM....',
  '....MMMMMMMMMMMMMMMM....',
  '.....MMMMMMMMMMMMMM.....',
  '.....MMMMMMMMMMMMMM.....',
  '......MMMMMMMMMMMM......',
  '.......MMMMMMMMMM.......',
  '.........MMMMMM.........',
  '.........DMMMMD.........',
  '......DDDDMMMMDDDD......',
  '...DDDDLLLDMMDLLLDDDD...',
  '..DDDDDLLLLDDLLLLDDDDD..',
  '.DDDDDDDLLLLLLLLDDDDDDD.',
  'DDDDDDDDDDDDDDDDDDDDDDDD',
  'DDDDDDMMDDDDDDDDMMDDDDDD',
  'DDDDDDMMDDDDDDDDMMDDDDDD',
  'DDDDDDDDDDDDDDDDDDDDDDDD',
]
const BOSS = [
  '.....DDDDDDDDDDDDDD.....',
  '....DDDDDDDLLDDDDDDDD...',
  '...DDDDDDDLWWLDDDDDDDD..',
  '...DDDDDDDDLLDDDDDDDDD..',
  '..KKKKKKKKKKKKKKKKKKKKK.',
  '....MMMMMMMMMMMMMMMMM...',
  '....MMMMMMMMMMMMMMMMM...',
  '...KKKKKKKKKKKKKKKKKKK..',
  '...KKKKKKKMMMKKKKKKKKK..',
  '....KKKKKMMMMMKKKKKKM...',
  '....MMMMMMMMMMMMMMMMM...',
  '....MMMMMMMLLMMMMMMMM...',
  '....MMMMMMMMMMMMMMMMM...',
  '.....MDDDDDDDDDDDDMM....',
  '.....MMMMMMMMMMMMMMM....',
  '......MMMMMMMMMMMMM.....',
  '.......MMMMMMMMMMM......',
  '........MMMMMMMMM.......',
  '..........MMMMM.........',
  '.......DDDDMMMDDDD......',
  '....DDDDLLDDDDDLLDDDD...',
  '..DDDDDDLWLDDDDLWLDDDDD.',
  '.DDDDDDDDLDDDDDDLDDDDDDD',
  'DDDDDDDDDDDDDDDDDDDDDDDD',
  'DDDDDDDDDDDDDDDDDDDDDDDD',
  'DDDDDDDDDDLLDDDDDDDDDDDD',
  'DDDDDDDDDDLLDDDDDDDDDDDD',
  'DDDDDDDDDDDDDDDDDDDDDDDD',
].map((r) => r.padEnd(24, '.').slice(0, 24))

const seg = typeof Intl !== 'undefined' && Intl.Segmenter
const graphemes = (s) => (seg ? [...new Intl.Segmenter('th', { granularity: 'grapheme' }).segment(s)].map((x) => x.segment) : [...s])
const words = (s) => (seg ? [...new Intl.Segmenter('th', { granularity: 'word' }).segment(s)].map((x) => x.segment) : graphemes(s))

// wrap Thai text to a width, breaking between words
function wrap(ctx, text, width) {
  const out = []
  let line = ''
  for (const w of words(text)) {
    if (line && ctx.measureText(line + w).width > width) {
      out.push(line)
      line = w.trimStart()
    } else line += w
  }
  if (line) out.push(line)
  return out
}

function portrait(ctx, rows, x, y, open, talking, t) {
  ctx.fillStyle = '#031a0c'
  ctx.fillRect(x, y, 90, 110)
  if (open <= 0) return
  const h = Math.round(110 * open)
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y + (110 - h) / 2, 90, h)
  ctx.clip()
  rows.forEach((row, j) => {
    for (let i = 0; i < 24; i++) {
      const c = PAL[row[i]]
      if (!c) continue
      ctx.fillStyle = c
      ctx.fillRect(x + 9 + i * 3, y + 13 + j * 3, 3, 3)
    }
  })
  // mouth: a dark slit, opening while this one talks
  const mouth = talking && Math.floor(t * 10) % 2 === 0 ? 3 : 1
  ctx.fillStyle = PAL.K
  ctx.fillRect(x + 9 + 9 * 3, y + 13 + 14 * 3, 18, mouth * 3)
  // codec noise: scanlines and a rolling glitch
  ctx.fillStyle = 'rgba(0,0,0,0.25)'
  for (let k = 0; k < 110; k += 2) ctx.fillRect(x, y + k, 90, 1)
  const g = ((t * 40) % 140) - 15
  ctx.fillStyle = 'rgba(160,255,190,0.12)'
  ctx.fillRect(x, y + g, 90, 3)
  ctx.restore()
}

// seven-segment digits for the frequency
const SEGS = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg' }
function digits(ctx, text, x, y, color) {
  ctx.fillStyle = color
  for (const ch of text) {
    if (ch === '.') {
      ctx.fillRect(x, y + 16, 2, 2)
      x += 5
      continue
    }
    const on = SEGS[ch] ?? ''
    const r = (s, rx, ry, w, h) => on.includes(s) && ctx.fillRect(x + rx, y + ry, w, h)
    r('a', 2, 0, 8, 2)
    r('b', 9, 1, 2, 8)
    r('c', 9, 9, 2, 8)
    r('d', 2, 16, 8, 2)
    r('e', 1, 9, 2, 8)
    r('f', 1, 1, 2, 8)
    r('g', 2, 8, 8, 2)
    x += 14
  }
}

export default function L6Molam({ total = 0, speed = 1 }) {
  const mode = useRetro()
  const start = useRef(0)
  const lines = useMemo(() => {
    const out = []
    for (const [who, text] of script(fmtV(total))) {
      const g = graphemes(text)
      const prev = out[out.length - 1]
      out.push({ who, text, g, at: prev ? prev.at + prev.dur + 0.9 : CONNECT + 0.5, dur: g.length / CPS })
    }
    return out
  }, [total])

  useEffect(() => {
    start.current = performance.now()
    const s = session(0.85)
    const thaiVoice = () => typeof speechSynthesis === 'undefined' ? null : speechSynthesis.getVoices().find((vo) => vo.lang?.startsWith('th'))
    const say = (who, text) => {
      if (typeof speechSynthesis === 'undefined' || !soundOn()) return
      const thai = thaiVoice()
      if (!thai) return
      const u = new SpeechSynthesisUtterance(text)
      u.voice = thai
      u.lang = 'th-TH'
      u.rate = 1.2 * Math.min(speed, 1.6)
      u.pitch = who === 'ผู้การ' ? 0.6 : 1.1
      speechSynthesis.speak(u)
    }
    if (s) {
      codecRing(s, speed)
      codecConnect(s, CONNECT / speed, speed)
      s.later(() => playFile(s, 'l6-radio.mp3', { loop: true }).then((ok) => {
        if (ok || !s.alive) return
        noise(s, { dur: 120, gain: 0.008, type: 'bandpass', freq: 2100, q: 1.5, loop: true, attack: 0.2 })
      }), CONNECT * 1000 / speed)
    }
    const timers = lines.map((l) =>
      setTimeout(() => {
        if (s?.alive) {
          // typing blips, then a squelch when the line ends
          codecText(s, { who: l.who, count: l.g.length, cps: CPS, speed, spoken: Boolean(thaiVoice() && soundOn()) })
          codecSquelch(s, l.dur / speed, speed)
        }
        say(l.who, l.text)
      }, (l.at * 1000) / speed),
    )
    return () => {
      timers.forEach(clearTimeout)
      s?.stop()
      if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel()
    }
  }, [lines, speed])

  const ref = useCanvas(
    (ctx, { w }) => {
      const t = ((performance.now() - start.current) / 1000) * speed
      const k = w / 320
      ctx.setTransform(k, 0, 0, k, 0, 0)
      ctx.imageSmoothingEnabled = false
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, 320, 240)
      ctx.fillStyle = 'rgba(30,120,60,0.08)'
      for (let y = 0; y < 240; y += 2) ctx.fillRect(0, y, 320, 1)

      // title
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = `700 15px ${FONT}`
      ctx.fillStyle = Math.floor(t * 2) % 2 ? '#ffffff' : '#ff3b30'
      ctx.fillText('ภัยพิบัติระดับหมอลำ', 160, 15)
      ctx.font = `600 8px ${FONT}`
      ctx.fillStyle = PAL.L
      ctx.fillText('DEFCON หมอลำ 1 · ทุกหน่วยเตรียมรับมือ', 160, 30)

      // who is talking now
      const now = lines.findLast((l) => t >= l.at)
      const typing = now && t < now.at + now.dur
      const open = Math.min(1, Math.max(0, (t - CONNECT) / 0.2))
      ctx.strokeStyle = PAL.L
      ctx.lineWidth = 2
      for (const [x, rows, who] of [[16, ME, 'ท่าน'], [214, BOSS, 'ผู้การ']]) {
        portrait(ctx, rows, x, 42, open, typing && now.who === who, t)
        ctx.strokeRect(x - 1, 41, 92, 112)
        if (open > 0 && t - CONNECT < 0.45) {
          // static on connect
          for (let n = 0; n < 40; n++) {
            ctx.fillStyle = rand(Math.floor(t * 60), n) > 0.5 ? PAL.W : PAL.D
            ctx.fillRect(x + rand(Math.floor(t * 60) + n, 1) * 88, 42 + rand(Math.floor(t * 60) + n, 2) * 108, 2 + rand(n, 3) * 10, 1)
          }
        }
        ctx.font = `700 9px ${FONT}`
        ctx.fillStyle = PAL.L
        ctx.fillText(who, x + 45, 162)
      }

      // centre: frequency, call light, level meters
      ctx.font = `700 7px ${FONT}`
      ctx.fillStyle = PAL.M
      ctx.fillText('PTT', 160, 56)
      if (t < CONNECT) {
        ctx.font = `700 12px ${FONT}`
        ctx.fillStyle = Math.floor(t * 6) % 2 ? PAL.W : PAL.D
        ctx.fillText('CALL', 160, 74)
      }
      digits(ctx, '220.50', 121, 84, PAL.W)
      ctx.font = `700 7px ${FONT}`
      ctx.fillStyle = PAL.M
      ctx.fillText('MHz · ไฟบ้าน', 160, 112)
      for (const [x, side] of [[118, 0], [196, 1]]) {
        const level = typing ? Math.floor(3 + rand(Math.floor(t * 14), side) * 6) : 1
        for (let n = 0; n < 9; n++) {
          ctx.fillStyle = n < level ? (n > 6 ? '#ffd60a' : PAL.L) : PAL.D
          ctx.fillRect(x, 140 - n * 3.5, 6, 2.5)
        }
      }
      ctx.fillStyle = PAL.D
      ctx.fillRect(132, 124, 56, 14)
      ctx.font = `700 8px ${FONT}`
      ctx.fillStyle = PAL.W
      ctx.fillText('MEMORY · แม่', 160, 131)

      // the subtitle box
      ctx.strokeStyle = PAL.M
      ctx.lineWidth = 1
      ctx.strokeRect(8.5, 172.5, 303, 62)
      if (now) {
        ctx.textAlign = 'left'
        ctx.textBaseline = 'top'
        ctx.font = `700 9px ${FONT}`
        ctx.fillStyle = now.who === 'ผู้การ' ? '#ffd60a' : PAL.L
        ctx.fillText(now.who, 16, 177)
        ctx.font = `500 11px ${FONT}`
        ctx.fillStyle = PAL.W
        const shown = now.g.slice(0, Math.floor((t - now.at) * CPS)).join('')
        wrap(ctx, shown, 286).slice(0, 3).forEach((l, i) => ctx.fillText(l, 16, 190 + i * 14))
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0)
    },
    { fixed: RES[mode] },
  )

  return (
    <div className="scene scene-codec">
      <canvas ref={ref} className="scene-canvas retro codec" aria-label="วิทยุสื่อสาร ภัยพิบัติระดับหมอลำ" />
    </div>
  )
}
