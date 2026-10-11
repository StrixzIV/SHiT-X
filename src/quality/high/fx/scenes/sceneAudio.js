import { noise, tone } from '../audio.js'

// Short, reference-checked openings, rather than newly composed game-style tunes.
// SMB: WaterMusData, NES frame durations; RSE: pokeemerald's mus_vs_wild.mid.
// Full references/provenance and the excerpt boundaries are in the audio handoff.
// The melodies/timing follow those references; browser synth voices approximate
// the instruments. Optional scene audio files still take priority.
const PITCH = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }

// Each token advances time: pitch[:steps] or .[:steps] for a rest. Sustain cells
// become nulls so a long note is triggered once. Size also pads silent tracks.
function phrase(score, size, velocity = 127) {
  const cells = []
  for (const token of score.trim().split(/\s+/)) {
    const [pitch, duration = '1', loudness = velocity] = token.split(':')
    const steps = Number(duration)
    if (!Number.isInteger(steps) || steps < 1) throw new Error(`Invalid note duration: ${token}`)
    if (pitch === '.') cells.push(...Array(steps).fill(null))
    else {
      const [, name, accidental, octave] = pitch.match(/^([A-G])([#b]?)(\d)$/)
      const midi = (Number(octave) + 1) * 12 + PITCH[name] + (accidental === '#' ? 1 : accidental === 'b' ? -1 : 0)
      cells.push([midi, steps, Number(loudness) / 127], ...Array(steps - 1).fill(null))
    }
  }
  if (cells.length > size) throw new Error(`Score exceeds its ${size}-step grid`)
  return [...cells, ...Array(size - cells.length).fill(null)]
}

// Original Super Mario Bros. (1985, NES), Underwater: the opening climb and
// first melody phrase (384 NTSC frames, ~6.39 s). One cell is eight frames.
// Keep the opening once, then loop the melody from frame 192 (cell 24).
export const UNDERWATER_SCORE = {
  bpm: 112.68525, stepsPerBeat: 4, loopStart: 24,
  tracks: [
    { notes: phrase(`
      D4:2 E4:2 F#4:2 G4:2 A4:2 Bb4:2 B4 B4 B4 . B4 . B4:4 G4:2 E5:6 Eb5:6 E5:6 . G4 A4 B4
      C5 D5
    `, 48), type: "pulse", duty: 0.5, hold: 0.55, cutoff: 6200, gain: 0.07 },
    { notes: phrase(`
      D4:2 C#4:2 C4:2 B3:2 C4:2 C#4:2 D4 D4 D4 . E4 . F4:6 G4:6 F#4:6 G4:6 .:6
    `, 48), type: "pulse", duty: 0.5, hold: 0.55, cutoff: 4800, gain: 0.035 },
    { notes: phrase(`
      .:16 G3:2 G3:6 C3:2 G3:2 C4:2 B2:2 G3:2 B3:2 C3:2 G3:2 C4:2 E3:2 G3:2 C4:2
    `, 48), type: "triangle", hold: 0.82, gain: 0.12 },
  ],
}

// Ruby/Sapphire/Emerald, Battle! Wild Pokemon: the source's first 576 MIDI
// ticks (~7.35 s) at 196 BPM, including its 192-tick chromatic intro. Repeat
// the following four-bar horn phrase, retaining original notes, rests and bass.
// Opening strings/harp and subsequent horns have separate voices; the original
// snare/timpani hit timing replaces the previously invented kick/hat pattern.
export const HOENN_BATTLE_SCORE = {
  bpm: 196, stepsPerBeat: 4, loopStart: 32,
  tracks: [
    { notes: phrase(`
      C6 B5 Bb5 A5 Bb5 A5 Ab5 G5 Ab5 G5 F#5 F5 F#5 F5 E5 Eb5 E5 Eb5 D5 C#5 D5 C#5 C5 B4 C5
      B4 Bb4 A4 Bb4 A4 Ab4 G4 .:64
    `, 96, 108), type: "sawtooth", detune: -3, hold: 0.6, attack: 0.002, cutoff: 5500, gain: 0.055 },
    { notes: phrase(`
      .:32 G4:2 .:4 C4:2 .:4 G4:2 .:2 Ab4:2 .:4 F4:2 .:4 Ab4:2 .:2 G4:2 .:4 C4:2 .:4 G4:2
      .:2 Ab4:2 .:4 Bb4:2 .:4 B4:4
    `, 96, 92), type: "brass", hold: 0.65, attack: 0.01, cutoff: 2500, gain: 0.092 },
    { notes: phrase(`
      G6 F#6 G6:2 G6 F#6 G6:2 G6 F#6 G6:2 G6 F#6 G6:2 G6 F#6 G6:2 G6 F#6 G6:2 G6 F#6 G6:2 G6
      F#6 G6:2 .:64
    `, 96, 100), type: "sine", attack: 0.002, gain: 0.055 },
    { notes: phrase(`
      .:32 C5:2 .:4 G4:2 .:4 C5:2 .:2 C#5:2 .:4 Eb5:2 .:4 C#5:2 .:2 C5:2 .:4 G4:2 .:4 C5:2
      .:2 C#5:2 .:4 Eb5:2 .:4 F5:4
    `, 96, 100), type: "brass", hold: 0.65, attack: 0.01, cutoff: 2300, gain: 0.055 },
    { notes: phrase(`
      G1:16 Bb1:8 B1:8 C2:2 G1:2 C2:2 C#2:4 C2:2 Bb1:2 C#2:2 C2:2 G1:2 C2:2 E2:4 C2:2 C#2:2
      B1:2 C2:2 G1:2 C2:2 C#2:4 C2:2 Bb1:2 C#2:2 C2:2 G1:2 C2:2 E2:4 C2:2 C#2:2 B1:2
    `, 96, 108), type: "pulse", duty: 0.5, hold: 0.8, cutoff: 1400, gain: 0.07 },
    { notes: phrase(`
      .:3 C7 .:3 C7 .:3 C7 .:3 C7 .:3 C7 .:3 C7 .:3 C7 .:3 C7 .:6 G3:2:60 .:4 C4:2:60 .:2
      C#4:2:60 .:4 Ab3:2:60 .:4 C#4:2:60 .:2 C4:2:60 .:4 G3:2:60 .:4 C4:2:60 .:2 C#4:2:60
      .:4 Ab3:2:60 .:4 F4:4:60
    `, 96, 52), type: "pulse", duty: 0.125, hold: 0.2, cutoff: 4200, gain: 0.025 },
    { notes: phrase(`
      C4 . G4 . C4 . G4 . C4 . G4 . C4 . G4 . Bb3 . F4 . Bb3 . F4 . Bb3 . F4 . Bb3 . F4 .:65
    `, 96, 64), type: "sawtooth", hold: 0.6, cutoff: 3500, gain: 0.023 },
    { notes: phrase(`
      .:28 D2:2 D2:2 .:4 D2:2 .:6 D2:2 .:6 D2:2 .:6 D2:2 .:6 D2:2 .:6 D2:2 .:6 D2:2 .:6 D2:2
      .:2
    `, 96, 112).map(n => n && [1800, n[1], n[2]]), type: "noise", noiseFilter: "bandpass", q: 0.65, attack: 0.002, gain: 0.07 },
    { notes: phrase(`
      .:16 C3:2 .:2 C3:2 .:2 C3:2 .:6 C3:2 .:6 C3:2 C3:2 .:4 C3:2 .:6 C3:2 C3:2 .:4 C3:2 .:6
      C3:2 C3:2 .:4 C3:2 .:6 C3:2 C3:2 .:4
    `, 96, 112), type: "kick", attack: 0.002, gain: 0.1 },
  ],
}

// Codec sound design: short high/low trills with silence between rings, then
// a descending data chirp. Frequencies are an original synthesized recreation.
export function codecRing(s, speed = 1) {
  for (const burst of [0, 0.34, 0.68]) {
    for (let k = 0; k < 8; k++) tone(s, {
      freq: k % 2 ? 2250 : 1500, type: 'pulse', duty: 0.25, cutoff: 4300,
      at: (burst + k * 0.024) / speed, dur: 0.022 / speed, hold: 0.75, gain: 0.06,
    })
  }
}
export function codecConnect(s, at, speed = 1) {
  tone(s, { freq: 2400, slideTo: 1100, type: 'sine', at, dur: 0.055 / speed, gain: 0.06 })
  tone(s, { freq: 1800, type: 'sine', at: at + 0.06 / speed, dur: 0.025 / speed, gain: 0.035 })
  noise(s, { at, dur: 0.16 / speed, gain: 0.09, type: 'bandpass', freq: 2900, q: 1.8 })
}
export function codecText(s, { who, count, cps, speed = 1, spoken = false }) {
  for (let k = 0; k < count / 2; k++) tone(s, {
    freq: (who === 'ผู้การ' ? 1680 : 1840) + (k % 3) * 70,
    type: 'sine', at: k * 2 / cps / speed, dur: 0.012 / speed, gain: spoken ? 0.005 : 0.014,
  })
}
export function codecSquelch(s, at, speed = 1) {
  noise(s, { at, dur: 0.055 / speed, gain: 0.045, type: 'bandpass', freq: 2800, q: 2.2 })
}
