import { useEffect } from 'react'
import { useCanvas } from './useCanvas.js'
import { playFile, sequence, session, tone } from '../audio.js'
import { UNDERWATER_SCORE } from './sceneAudio.js'

// Level 0 — safe: a Famicom-style underwater stage. 240 px tall like the NES,
// but as wide as the screen (portrait phones get a taller water column instead).
// First the black lives screen the era showed before every stage (WORLD 0-0,
// Claude × 3), in silence; then the stage and its music. The hero is Claude
// Code's mascot in a hard hat (it built this), its USB-C cable trailing behind.
// Original sprites and a short opening of the original NES underwater theme; drop
// public/fx/l0-underwater.mp3 in to replace the music.
const INTRO_S = 2.4
const stage = (cw, ch) => {
  const aspect = cw / ch
  return aspect >= 256 / 240 ? [Math.round(240 * aspect), 240] : [256, Math.round(256 / aspect)]
}

const C = {
  water: '#2038ec', foam: '#fcfcfc', foam2: '#3cbcfc', rock: '#00a844', rockHi: '#58f898', rockLo: '#005800',
  coral: '#f878f8', coral2: '#d82800', black: '#000000', white: '#fcfcfc',
  fish: '#fc7460', grey: '#7c7c7c', claude: '#d97757', hat: '#f8d030', hatLo: '#c08800',
}

// Claude Code's mascot, block for block from its welcome banner
//   ▐▛███▜▌ / ▝▜█████▛▘ / ▘▘ ▝▝   (each block glyph = 2×2 pixels)
// plus a construction hard hat. O body, E eyes, H hat, h hat shade.
const CLAWD = [
  '......HHHHHH......',
  '.....HHHHHHHH.....',
  '..hhhhhhhhhhhhhh..',
  '...OOOOOOOOOOOO...',
  '...OOEOOOOOOEOO...',
  '.OOOOOOOOOOOOOOOO.',
  '...OOOOOOOOOOOO...',
]
const CLAWD_BLINK = '...OOOOOOOOOOOO...'
const CLAWD_LEGS = ['....O.O....O.O....', '...O.O......O.O...']

const PAL = { O: C.claude, E: C.black, H: C.hat, h: C.hatLo }

function sprite(ctx, rows, x, y, { scale = 1, flip = false } = {}) {
  rows.forEach((row, j) => {
    for (let i = 0; i < row.length; i++) {
      const c = PAL[row[flip ? row.length - 1 - i : i]]
      if (c) {
        ctx.fillStyle = c
        ctx.fillRect(Math.round(x) + i * scale, Math.round(y) + j * scale, scale, scale)
      }
    }
  })
}

function fish(ctx, x, y, frame) {
  ctx.fillStyle = C.fish
  ctx.fillRect(x + 1, y, 6, 1)
  ctx.fillRect(x, y + 1, 8, 3)
  ctx.fillRect(x + 1, y + 4, 6, 1)
  ctx.fillRect(x + 8, y + (frame ? 0 : 1), 2, 2)
  ctx.fillRect(x + 8, y + (frame ? 3 : 2), 2, 2)
  ctx.fillStyle = C.white
  ctx.fillRect(x + 1, y + 1, 2, 2)
  ctx.fillStyle = C.black
  ctx.fillRect(x + 1, y + 2, 1, 1)
}

function coral(ctx, x, base, h, color) {
  ctx.fillStyle = color
  ctx.fillRect(x + 3, base - h, 2, h)
  for (let k = 0; k < h; k += 5) {
    const side = (k / 5) % 2 ? -1 : 1
    ctx.fillRect(x + 3 + side * 2, base - k - 4, 2, 4)
    ctx.fillRect(x + 3 + side * 3, base - k - 6, 2, 3)
  }
}

// Claude, the hero: swims against the scroll, sinking slowly and kicking up every
// ~0.6 s, its USB-C cable trailing behind; says what it's doing now and then.
function hero(ctx, w, h, t) {
  const kick = (t % 0.6) / 0.6
  const x = w * 0.3 + Math.sin(t * 0.35) * 24
  const y = h * 0.47 + Math.sin(t * 0.8) * 20 - (kick < 0.3 ? (0.3 - kick) * 12 : 0)
  // the cable, waving behind, its plug on the end
  ctx.fillStyle = C.white
  for (let k = 0; k < 18; k++) ctx.fillRect(Math.round(x + 2 - k * 1.6), Math.round(y + 10 + Math.sin(t * 5 - k * 0.6) * 2 + k * 0.3), 1, 1)
  ctx.fillStyle = C.grey
  ctx.fillRect(Math.round(x + 2 - 18 * 1.6) - 2, Math.round(y + 15), 3, 2)
  const rows = [...CLAWD]
  if (Math.floor(t * 10) % 37 === 0) rows[4] = CLAWD_BLINK
  rows.push(CLAWD_LEGS[kick < 0.3 ? 0 : 1])
  sprite(ctx, rows, x, y, { scale: 2 })
  // bubbles rising off it
  for (let k = 0; k < 4; k++) {
    const age = (t * 0.9 + k * 0.25) % 1
    ctx.fillStyle = C.white
    ctx.fillRect(Math.round(x + 26 + Math.sin(age * 12 + k) * 2), Math.round(y - age * (y - 46)), 2, 2)
  }
  // speech bubble: 2 s out of every 6, the first a second into the stage
  if ((t + 3) % 6 > 4) {
    const text = 'BUILDING iLEAK...'
    ctx.font = '8px "Press Start 2P", monospace'
    const tw = Math.ceil(ctx.measureText(text).width)
    const bx = Math.round(Math.min(Math.max(4, x + 18 - tw / 2 - 6), w - tw - 16))
    const by = Math.round(y - 30)
    ctx.fillStyle = C.black
    ctx.fillRect(bx - 1, by - 1, tw + 14, 16)
    ctx.fillStyle = C.white
    ctx.fillRect(bx, by, tw + 12, 14)
    ctx.fillRect(Math.round(x + 16), by + 14, 4, 3)
    ctx.fillStyle = C.black
    ctx.textBaseline = 'top'
    ctx.fillText(text, bx + 6, by + 3)
  }
}

// the HUD across the top, as on both the lives screen and the stage
function hud(ctx, w, total) {
  ctx.fillStyle = C.white
  ctx.font = '8px "Press Start 2P", monospace'
  ctx.textBaseline = 'top'
  const col = (f) => Math.round(w * f)
  ctx.fillText('iLEAK', col(0.09), 14)
  ctx.fillText(String(Math.round(total)).padStart(6, '0'), col(0.09), 24)
  ctx.fillText('⚡x00', col(0.37), 24)
  ctx.fillText('WORLD', col(0.56), 14)
  ctx.fillText(' 0-0', col(0.56), 24)
  ctx.fillText('VOLT', col(0.81), 14)
  ctx.fillText('  0', col(0.81), 24)
}

// black, the HUD, WORLD 0-0, and Claude with the lives left
function livesScreen(ctx, w, h, total) {
  ctx.fillStyle = C.black
  ctx.fillRect(0, 0, w, h)
  hud(ctx, w, total)
  const cx = Math.round(w / 2)
  ctx.fillStyle = C.white
  ctx.fillText('WORLD 0-0', cx - 36, 80)
  sprite(ctx, [...CLAWD, CLAWD_LEGS[0]], cx - 40, 104, { scale: 2 })
  ctx.fillStyle = C.white
  ctx.fillText('x  3', cx + 6, 108)
}

export default function L0Underwater({ total = 0, speed = 1 }) {
  useEffect(() => {
    const s = session(0.8)
    if (!s) return
    // silent through the lives screen, then the stage's music
    s.later(() => playFile(s, 'l0-underwater.mp3', { loop: true }).then((ok) => {
      if (ok || !s.alive) return
      sequence(s, { ...UNDERWATER_SCORE, bpm: UNDERWATER_SCORE.bpm * speed })
    }), (INTRO_S * 1000) / speed)
    // bubbles, and a little "bloop" when Claude speaks
    s.later(() => {
      s.every(() => tone(s, { freq: 700, slideTo: 1500, dur: 0.07, gain: 0.03, type: 'square' }), 900)
      s.later(() => s.every(() => {
        tone(s, { freq: 880, type: 'square', dur: 0.06, gain: 0.03 })
        tone(s, { freq: 1320, type: 'square', at: 0.07, dur: 0.08, gain: 0.03 })
      }, 6000), 4000)
    }, (INTRO_S * 1000) / speed)
    return () => s.stop()
  }, [speed])

  const ref = useCanvas(
    (ctx, { w, h, t: clock }) => {
      if (clock * speed < INTRO_S) return livesScreen(ctx, w, h, total)
      // the stage's own clock starts at the cut
      const t = clock - INTRO_S / speed
      const scroll = t * 14
      const floor = h - 32
      ctx.fillStyle = C.water
      ctx.fillRect(0, 0, w, h)

      // foam waves along the surface
      for (let x = -16; x < w + 16; x += 16) {
        const ox = x - (scroll % 16)
        ctx.fillStyle = C.foam2
        ctx.fillRect(ox, 44, 16, 2)
        ctx.fillStyle = C.foam
        ctx.fillRect(ox + 2, 40, 12, 2)
        ctx.fillRect(ox, 42, 4, 2)
        ctx.fillRect(ox + 12, 42, 4, 2)
      }

      // seafloor rock blocks
      for (let row = 0; row < 2; row++) {
        for (let x = -16; x < w + 16; x += 16) {
          const ox = x - ((scroll * 1.2) % 16)
          const oy = floor + row * 16
          ctx.fillStyle = C.rock
          ctx.fillRect(ox, oy, 16, 16)
          ctx.fillStyle = C.rockHi
          ctx.fillRect(ox + 1, oy + 1, 6, 2)
          ctx.fillRect(ox + 9, oy + 8, 5, 2)
          ctx.fillStyle = C.rockLo
          ctx.fillRect(ox, oy + 15, 16, 1)
          ctx.fillRect(ox + 15, oy, 1, 16)
          ctx.fillRect(ox + 4, oy + 10, 2, 2)
        }
      }
      // coral, scrolling with the floor (one every ~50 px of width)
      const corals = Math.ceil(w / 50)
      const span = corals * 50
      for (let k = 0; k < corals; k++) {
        const x = (((k * 50 + (k % 3) * 11 - scroll * 1.2) % span) + span) % span - 22
        coral(ctx, x, floor, 18 + (k % 3) * 8, k % 2 ? C.coral : C.coral2)
      }

      // fish (more on wider screens)
      const school = Math.max(3, Math.round(w / 90))
      for (let k = 0; k < school; k++) {
        const x = w + 14 - ((t * (22 + (k % 4) * 9) + k * 97) % (w + 40))
        const y = 64 + ((k * 53) % Math.max(40, floor - 96))
        fish(ctx, Math.round(x), y + Math.round(Math.sin(t * 2 + k) * 3), Math.floor(t * 4 + k) % 2)
      }

      // Claude, the hero
      hero(ctx, w, h, t)

      hud(ctx, w, total)
    },
    { size: stage },
  )

  return (
    <div className="scene scene-nes">
      <canvas ref={ref} className="pixel-canvas" aria-label="ด่านใต้น้ำ ปลอดภัย พร้อม Claude ที่กำลังสร้างแอปนี้" />
    </div>
  )
}
