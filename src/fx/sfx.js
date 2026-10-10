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

// Balatro-ish scoring sounds. `i` is the step index: pitch climbs each step.
const up = (i) => 2 ** (Math.min(i, 24) / 12)

export function chipSound(i) {
  beep(520 * up(i), 0.05, 'triangle', 0.14)
  setTimeout(() => beep(780 * up(i), 0.07, 'triangle', 0.1), 45)
}

export function multSound(i) {
  beep(660 * up(i), 0.12, 'square', 0.09, 990 * up(i))
}

export function xmultSound(i) {
  ;[0, 4, 7, 12].forEach((n, k) => setTimeout(() => beep(440 * up(i) * 2 ** (n / 12), 0.14, 'square', 0.09), k * 55))
  beep(220, 0.45, 'sawtooth', 0.07, 1760)
}

export function zeroSound() {
  beep(420, 0.25, 'square', 0.12, 300)
  setTimeout(() => beep(300, 0.5, 'square', 0.12, 90), 260)
}

export function tick(i) {
  beep(900 + i * 25, 0.015, 'square', 0.035)
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

// Filtered noise burst. `size` 0..1 scales length and loudness.
export function boom(size = 1) {
  if (!enabled) return
  const c = audio()
  if (!c) return
  const len = c.sampleRate * (0.4 + size * 1.4)
  const buf = c.createBuffer(1, len, c.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2
  const src = c.createBufferSource()
  const lp = c.createBiquadFilter()
  const g = c.createGain()
  src.buffer = buf
  lp.type = 'lowpass'
  lp.frequency.value = 400 + size * 1200
  g.gain.value = 0.25 + size * 0.35
  src.connect(lp).connect(g).connect(c.destination)
  src.start()
}

export function siren(seconds = 2) {
  if (!enabled) return
  const c = audio()
  if (!c) return
  const o = c.createOscillator()
  const lfo = c.createOscillator()
  const depth = c.createGain()
  const g = c.createGain()
  o.type = 'square'
  o.frequency.value = 700
  lfo.frequency.value = 3
  depth.gain.value = 250
  g.gain.value = 0.08
  lfo.connect(depth).connect(o.frequency)
  o.connect(g).connect(c.destination)
  o.start()
  lfo.start()
  o.stop(c.currentTime + seconds)
  lfo.stop(c.currentTime + seconds)
}
