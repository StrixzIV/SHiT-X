import { session, tone } from '../fx/audio.js'
import { getAudio, soundOn } from '../fx/sfx.js'

export const SOUND_FILES = {
  startup: 'xp-startup',
  exclamation: 'xp-exclamation',
  critical: 'xp-critical',
  ding: 'xp-ding',
  notify: 'xp-notify',
  deviceConnect: 'xp-device-connect',
  deviceDisconnect: 'xp-device-disconnect',
  start: 'xp-start',
  shutdown: 'xp-shutdown',
}

const NOTES = {
  startup: [[392, 0, .24], [587, .12, .3], [740, .28, .38], [880, .46, .6]],
  exclamation: [[660, 0, .13], [440, .14, .25]],
  critical: [[196, 0, .24], [185, .26, .32]],
  ding: [[1047, 0, .45]],
  notify: [[784, 0, .12], [988, .13, .25]],
  deviceConnect: [[440, 0, .1], [659, .1, .1], [880, .2, .2]],
  deviceDisconnect: [[880, 0, .1], [659, .1, .1], [440, .2, .24]],
  start: [[523, 0, .065], [784, .06, .09]],
  shutdown: [[740, 0, .25], [587, .18, .3], [392, .36, .45]],
}

const clips = new Map()
const pending = new Set()
let listening = false

async function loadClip(ctx, event) {
  if (!clips.has(event)) {
    clips.set(event, (async () => {
      for (const ext of ['mp3', 'wav', 'ogg']) {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 700)
        try {
          const response = await fetch(`${import.meta.env.BASE_URL}sounds/${SOUND_FILES[event]}.${ext}`, { signal: controller.signal })
          if (!response.ok || /text\/html/.test(response.headers.get('content-type') || '')) continue
          return await ctx.decodeAudioData(await response.arrayBuffer())
        } catch { /* missing or undecodable drop-in: try the next format */ }
        finally { clearTimeout(timeout) }
      }
      return null
    })())
  }
  return clips.get(event)
}

function listenForAudio() {
  if (listening) return
  listening = true
  const unlock = () => {
    if (!pending.size) return
    const audio = getAudio()
    if (!audio) return
    audio.ctx.resume().then(() => {
      if (audio.ctx.state !== 'running') return
      const waiting = [...pending]
      pending.clear()
      waiting.forEach((play) => play())
    }).catch(() => {})
  }
  window.addEventListener('pointerdown', unlock, true)
  window.addEventListener('keydown', unlock, true)
  window.addEventListener('touchstart', unlock, { capture: true, passive: true })
}

// Returns a cleanup function so a dialog closing or StrictMode replay cancels its sound.
export function schemeSound(event = 'ding') {
  if (!SOUND_FILES[event] || !soundOn()) return () => {}
  let stopped = false
  let sound
  const play = async () => {
    if (stopped || !soundOn()) return
    sound = session(.65)
    if (!sound) return
    const buffer = await loadClip(sound.ctx, event)
    if (stopped || !sound.alive || !soundOn()) return sound.stop()
    if (buffer) {
      const source = sound.ctx.createBufferSource()
      source.buffer = buffer
      source.connect(sound.out)
      sound.keep(source)
      source.start()
      sound.later(() => sound.stop(), buffer.duration * 1000 + 100)
    } else {
      for (const [freq, at, dur] of NOTES[event]) {
        tone(sound, { freq, at, dur, type: 'sine', gain: .16, attack: .015 })
        tone(sound, { freq: freq * 2, at, dur, type: 'triangle', gain: .025, attack: .025 })
      }
      sound.later(() => sound.stop(), 1500)
    }
  }
  const audio = getAudio()
  if (audio?.ctx.state === 'running') play()
  else if (audio) {
    pending.add(play)
    listenForAudio()
  }
  return () => {
    stopped = true
    pending.delete(play)
    sound?.stop()
  }
}
