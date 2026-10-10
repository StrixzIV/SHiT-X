// Sound toolkit for the result scenes. Each scene opens one session; everything
// it plays routes through the session's gain, so closing the scene fades it all out.
// All music here is original and synthesized. A scene may also try a drop-in file
// from public/fx/ first (see ARCHITECTURE.md "Result scenes").
import { getAudio } from './sfx.js'

export const asset = (name) => `${import.meta.env.BASE_URL}fx/${name}`

let noiseBuf
function noiseBuffer(ctx) {
  if (noiseBuf && noiseBuf.sampleRate === ctx.sampleRate) return noiseBuf
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
  const d = noiseBuf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  return noiseBuf
}

export function session(volume = 0.9) {
  const a = getAudio()
  if (!a) return null
  const { ctx, master } = a
  const out = ctx.createGain()
  out.gain.value = volume
  out.connect(master)
  const timers = new Set()
  const nodes = new Set()
  const media = new Set()
  let alive = true

  const s = {
    ctx,
    out,
    get alive() {
      return alive
    },
    get now() {
      return ctx.currentTime
    },
    later(fn, ms) {
      const t = setTimeout(() => {
        timers.delete(t)
        if (alive) fn()
      }, ms)
      timers.add(t)
    },
    every(fn, ms) {
      const t = setInterval(() => alive && fn(), ms)
      timers.add(t)
    },
    keep(node) {
      nodes.add(node)
      return node
    },
    media(el) {
      media.add(el)
      return el
    },
    stop() {
      if (!alive) return
      alive = false
      timers.forEach((t) => {
        clearTimeout(t)
        clearInterval(t)
      })
      out.gain.setTargetAtTime(0, ctx.currentTime, 0.06)
      media.forEach((el) => el.pause())
      setTimeout(() => {
        nodes.forEach((n) => {
          try { n.stop?.() } catch { /* already stopped */ }
          try { n.disconnect() } catch { /* already gone */ }
        })
        try { out.disconnect() } catch { /* already gone */ }
      }, 400)
    },
  }
  return s
}

// One oscillator note with a simple envelope.
export function tone(s, { freq, type = 'square', at = 0, dur = 0.2, gain = 0.1, slideTo, attack = 0.005, dest, detune = 0 }) {
  if (!s?.alive) return
  const { ctx } = s
  const t = ctx.currentTime + at
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = type
  o.detune.value = detune
  o.frequency.setValueAtTime(freq, t)
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(gain, t + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(dest ?? s.out)
  o.start(t)
  o.stop(t + dur + 0.05)
  s.keep(o)
}

// A burst of filtered white noise (cracks, rain, static, breath).
export function noise(s, { at = 0, dur = 0.3, gain = 0.2, type = 'lowpass', freq = 1200, q = 0.7, sweepTo, attack = 0.002, dest, loop = false }) {
  if (!s?.alive) return null
  const { ctx } = s
  const t = ctx.currentTime + at
  const src = ctx.createBufferSource()
  src.buffer = noiseBuffer(ctx)
  src.loop = loop
  const f = ctx.createBiquadFilter()
  f.type = type
  f.frequency.setValueAtTime(freq, t)
  f.Q.value = q
  if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur)
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(gain, t + attack)
  if (!loop) g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  src.connect(f).connect(g).connect(dest ?? s.out)
  src.start(t)
  if (!loop) src.stop(t + dur + 0.05)
  s.keep(src)
  return { src, filter: f, gain: g }
}

// Generated impulse response: cheap, asset-free reverb.
export function reverb(s, seconds = 3, decay = 2.5, wet = 0.6) {
  const { ctx } = s
  const len = Math.floor(ctx.sampleRate * seconds)
  const ir = ctx.createBuffer(2, len, ctx.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** decay
  }
  const conv = ctx.createConvolver()
  conv.buffer = ir
  const input = ctx.createGain()
  const wetG = ctx.createGain()
  wetG.gain.value = wet
  input.connect(conv).connect(wetG).connect(s.out)
  input.connect(s.out)
  return input
}

// Soft-clip distortion stage.
export function drive(s, amount = 8, dest) {
  const { ctx } = s
  const ws = ctx.createWaveShaper()
  const n = 1024
  const curve = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1
    curve[i] = Math.tanh(amount * x) / Math.tanh(amount)
  }
  ws.curve = curve
  ws.connect(dest ?? s.out)
  return ws
}

// A sung vowel: two detuned saws through "ah" formants. Used for the heaven choir
// and the FAHH scream.
export function voice(s, { freq, at = 0, dur = 2, gain = 0.06, attack = 0.4, vibrato = 5, formants = [800, 1150, 2900], slideTo, dest }) {
  if (!s?.alive) return
  const { ctx } = s
  const t = ctx.currentTime + at
  const mix = ctx.createGain()
  mix.gain.setValueAtTime(0.0001, t)
  mix.gain.exponentialRampToValueAtTime(gain, t + attack)
  mix.gain.setValueAtTime(gain, t + Math.max(attack, dur - 0.6))
  mix.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  const lfo = ctx.createOscillator()
  const lfoG = ctx.createGain()
  lfo.frequency.value = vibrato
  lfoG.gain.value = freq * 0.012
  lfo.connect(lfoG)
  const bands = formants.map((f, i) => {
    const b = ctx.createBiquadFilter()
    b.type = 'bandpass'
    b.frequency.value = f
    b.Q.value = 6 + i * 2
    b.connect(mix)
    return b
  })
  for (const det of [-7, 6]) {
    const o = ctx.createOscillator()
    o.type = 'sawtooth'
    o.frequency.setValueAtTime(freq, t)
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur)
    o.detune.value = det
    lfoG.connect(o.frequency)
    bands.forEach((b) => o.connect(b))
    o.start(t)
    o.stop(t + dur + 0.1)
    s.keep(o)
  }
  lfo.start(t)
  lfo.stop(t + dur + 0.1)
  s.keep(lfo)
  mix.connect(dest ?? s.out)
}

// Tiny looping step sequencer for chiptunes. `tracks` = [{ notes: [midi | [midi, steps] | null...],
// type, gain, len (steps) }]; every track shares the step grid. type 'noise' uses the note as a
// highpass cutoff in Hz (drums).
export function sequence(s, { bpm, stepsPerBeat = 2, tracks, loops = Infinity }) {
  if (!s?.alive) return
  const stepDur = 60 / bpm / stepsPerBeat
  const length = Math.max(...tracks.map((t) => t.notes.length))
  let step = 0
  let loop = 0
  let next = s.now + 0.05
  const hz = (m) => 440 * 2 ** ((m - 69) / 12)
  const tick = () => {
    while (next < s.now + 0.25) {
      for (const tr of tracks) {
        const n = tr.notes[step % tr.notes.length]
        if (n == null) continue
        const [m, len] = Array.isArray(n) ? n : [n, tr.len ?? 0.9]
        if (tr.type === 'noise') noise(s, { at: next - s.now, dur: stepDur * len, gain: tr.gain, type: 'highpass', freq: m })
        else tone(s, { freq: hz(m), type: tr.type, at: next - s.now, dur: stepDur * len, gain: tr.gain })
      }
      next += stepDur
      step++
      if (step % length === 0 && ++loop >= loops) return
    }
  }
  tick()
  s.every(tick, 100)
}

// Try drop-in audio files in order (a name or a list of names); resolve false if
// none plays. Firebase answers unknown paths with index.html, which simply fails to decode.
export async function playFile(s, names, opts) {
  for (const name of [].concat(names)) {
    if (!s?.alive) return false
    if (await playOne(s, name, opts)) return true
  }
  return false
}

function playOne(s, name, { loop = false, gain = 1 } = {}) {
  return new Promise((resolve) => {
    let settled = false
    const settle = (ok) => {
      if (settled) return
      settled = true
      resolve(ok)
    }
    const el = new Audio(asset(name))
    el.loop = loop
    el.preload = 'auto'
    el.addEventListener('error', () => settle(false), { once: true })
    el.addEventListener('canplay', () => {
      if (settled || !s.alive) return settle(false)
      try {
        const src = s.ctx.createMediaElementSource(el)
        const g = s.ctx.createGain()
        g.gain.value = gain
        src.connect(g).connect(s.out)
      } catch { /* already routed */ }
      s.media(el)
      el.play().then(() => settle(true), () => settle(false))
    }, { once: true })
    // Too slow counts as missing; a late load is ignored (settled) so it never doubles up.
    setTimeout(() => settle(false), 2500)
  })
}

// Load the first drop-in image that exists (a name or a list of names).
export function loadImage(names, onLoad) {
  const list = [].concat(names)
  const next = (i) => {
    if (i >= list.length) return
    const im = new Image()
    im.onload = () => onLoad(im)
    im.onerror = () => next(i + 1)
    im.src = asset(list[i])
  }
  next(0)
}
