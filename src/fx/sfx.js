// Tiny WebAudio synth. No asset files, works offline.
let ctx
let enabled = true
export const setSound = (on) => { enabled = on }

function audio() {
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return null
  ctx ??= new AC()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

export function beep(freq = 440, dur = 0.12, type = 'square', vol = 0.12, slideTo) {
  if (!enabled) return
  const c = audio()
  if (!c) return
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, c.currentTime)
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime + dur)
  g.gain.setValueAtTime(vol, c.currentTime)
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur)
  o.connect(g).connect(c.destination)
  o.start()
  o.stop(c.currentTime + dur + 0.02)
}

// Rising pentatonic chime, one note per scoring step (the Balatro tally feel).
const PENTA = [0, 2, 4, 7, 9]
export function chime(step, kind) {
  const n = PENTA[step % 5] + 12 * Math.floor(step / 5)
  const f = 330 * 2 ** (n / 12)
  beep(f, 0.09, kind === 'chips' ? 'triangle' : 'square', 0.1)
  if (kind === 'xmult') beep(f * 1.5, 0.18, 'sawtooth', 0.08)
}

export function shock() {
  beep(880, 0.45, 'sawtooth', 0.25, 90)
  setTimeout(() => beep(60, 0.6, 'square', 0.2, 40), 80)
  navigator.vibrate?.([300, 100, 300, 100, 600])
}

export function safe() {
  beep(523, 0.1, 'triangle')
  setTimeout(() => beep(784, 0.2, 'triangle'), 110)
}
