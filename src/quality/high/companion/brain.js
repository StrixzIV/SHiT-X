import { useSyncExternalStore } from 'react'
import { beep, getAudio, soundOn } from '../fx/sfx.js'
import { candidates, fallbackLine } from './lines.js'
import { canReact, readSurroundings, surroundingsKey } from './surroundings.js'

// น้องปลั๊ก's brain. Anything in the app calls `nudge(event, detail)`; she decides
// whether it's worth a comment, asks DeepSeek through the Firebase/Vite API
// or picks a prewritten line, and sends it MSN-style: one short message per
// phrase, each read by Paxa, with a breath between (the TTS reads a whole line in
// one unpaced run otherwise). What to show goes through a tiny store the frame
// (Companion.jsx) and her independently orbiting L7 window read.
//
// Priority: 2 = always comment (queued behind the current line, newest wins),
// 1 = comment unless she's mid-sentence, 0 = clicks and idling, only now and then.

const API = '/api/companion'
const GAP = [7000, 1800, 0] // quiet time after a line before each priority may speak
const CHANCE = [0.55, 1, 1]
// How DeepSeek should treat the prewritten lines this time (a suggestion it may overrule).
const MODES = [['builtin', 0.25], ['extend', 0.25], ['shorten', 0.2], ['own', 0.3]]
const pickMode = () => {
  let r = Math.random()
  return (MODES.find(([, w]) => (r -= w) < 0) ?? MODES[3])[0]
}
const PAUSE = 0.3 // seconds between messages
const BUBBLE_GAP = 10000 // actual message sends less than 10 s apart share a bubble
const MAX_BUBBLES = 3
const MAX_DEBRIS = 32

// bubbles persist until clicked (or displaced by a fourth). msgs is only the
// current spoken line. L7 has a live MSN bubble and a separate collection of
// finished bubbles: once pulled into space they can no longer absorb new text.
let state = { bubbles: [], activeBubble: null, msgs: [], face: 'hello', typing: false, stowaway: false, spaceBubble: null, debris: [] }
let bubbleId = 0
const subs = new Set()
const set = (patch) => {
  state = { ...state, ...patch }
  subs.forEach((f) => f())
}
const subscribe = (f) => {
  subs.add(f)
  return () => subs.delete(f)
}
export const useCompanion = () => useSyncExternalStore(subscribe, () => state)
export const face = (name) => `${import.meta.env.BASE_URL}companion/${name}.webp`

// Static-only hosts may rewrite /api to index.html. Anything other than our JSON
// counts as "none", preserving offline/prewritten behavior.
let backend = null
const probe = () =>
  (backend ??= fetch(`${API}/health`, { signal: AbortSignal.timeout?.(3000) })
    .then((r) => (r.ok && r.headers.get('content-type')?.includes('json') ? r.json() : {}))
    .then((h) => ({ llm: !!h.llm, tts: !!h.tts }))
    .catch(() => ({ llm: false, tts: false })))

let busy = false
let pending = null
let quietUntil = 0
let line = 0 // invalidates async work when she is interrupted
let voice = null // the BufferSource playing now
let speakingIn = null
const recent = []

// The UI calls this when the scene or her physical presence changes. Also check
// before sending a request and before each spoken phrase, including slow replies.
export function syncSurroundings() {
  const surroundings = readSurroundings(state.stowaway)
  if (speakingIn && (speakingIn !== surroundingsKey(surroundings) || !surroundings.tabVisible)) cut(true)
  return surroundings
}

export function nudge(event, detail = {}, priority = 1) {
  const surroundings = syncSurroundings()
  if (!canReact(event, surroundings)) return
  detail = { ...detail, surroundings }
  if (priority < 2 && Date.now() < quietUntil - GAP[0] + GAP[priority]) return
  if (busy) {
    if (priority >= 2) pending = [event, detail]
    return
  }
  if (Math.random() > CHANCE[priority]) return
  run(event, detail)
}

// Stop talking now: the current line and anything queued are dropped.
function cut(collect = false) {
  voice?.stop()
  voice = null
  line += 1
  busy = false
  pending = null
  speakingIn = null
  set({ msgs: [], typing: false, activeBubble: null, spaceBubble: null,
    debris: collect && state.spaceBubble?.msgs.length ? collectBubble(state.spaceBubble) : state.debris,
    bubbles: state.bubbles.filter((b) => b.msgs.length) })
}
// The other quality trees do not mount her UI or its surroundings observer.
// Stop both playing speech and delayed work when leaving the High tree.
export function stopCompanion() {
  cut()
  set({ stowaway: false, debris: [] })
}
// Dismissing old messages leaves the current speech and queued line alone. The
// active bubble also cuts off speech, including the last phrase's playing voice.
export function hush(id) {
  if (id === state.activeBubble) cut()
  set({ bubbles: state.bubbles.filter((b) => b.id !== id), debris: state.debris.filter((b) => b.id !== id) })
}

const freshBubble = () => ({ id: ++bubbleId, msgs: [], face: 'idea', lastAt: null })
const collectBubble = (bubble) => [...state.debris, bubble].slice(-MAX_DEBRIS)
const recentBubble = (b, now) => b && b.lastAt !== null && now - b.lastAt < BUBBLE_GAP

function startTyping() {
  const patch = { msgs: [], typing: true, face: 'idea', activeBubble: null }
  if (state.stowaway) {
    const spaceBubble = freshBubble()
    return set({ ...patch, spaceBubble, activeBubble: spaceBubble.id })
  }
  const last = state.bubbles[state.bubbles.length - 1]
  const bubble = recentBubble(last, Date.now()) ? last : freshBubble()
  const bubbles = bubble === last ? state.bubbles : [...state.bubbles, bubble].slice(-MAX_BUBBLES)
  set({ ...patch, bubbles, activeBubble: bubble.id })
}

function sendMessage(part, face, typing) {
  const patch = { msgs: [...state.msgs, part], face, typing }
  if (state.stowaway) {
    const bubble = state.spaceBubble ?? freshBubble()
    const spaceBubble = { ...bubble, msgs: [...bubble.msgs, part], face, lastAt: Date.now() }
    return set({ ...patch, spaceBubble, activeBubble: spaceBubble.id })
  }
  const now = Date.now()
  const last = state.bubbles[state.bubbles.length - 1]
  // Recheck at send time: composing/TTS can take longer than the grouping gap.
  const reuse = last && (!last.msgs.length || recentBubble(last, now))
  const bubble = reuse ? last : freshBubble()
  const updated = { ...bubble, msgs: [...bubble.msgs, part], face, lastAt: now }
  const bubbles = [...(reuse ? state.bubbles.slice(0, -1) : state.bubbles), updated].slice(-MAX_BUBBLES)
  set({ ...patch, bubbles, activeBubble: updated.id })
}

// Her window and existing notifications get their own L7 orbits. Keep desktop
// history separate so returning from space restores the normal three-bubble UI.
export function setStowaway(on) {
  if (on === state.stowaway) return
  cut()
  set({ stowaway: on, debris: on ? [...state.bubbles] : [] })
}

async function compose(event, detail) {
  const { llm } = await probe()
  if (llm) {
    try {
      const r = await fetch(`${API}/say`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, detail, recent: recent.slice(-5), builtin: candidates(event, detail), mode: pickMode() }),
        signal: AbortSignal.timeout?.(9000),
      })
      if (r.ok) {
        const reply = await r.json()
        if (typeof reply.text === 'string' && reply.text.trim()) return reply
      }
    } catch { /* fall through to the prewritten lines */ }
  }
  return fallbackLine(event, detail, recent)
}

// Thai puts its spaces between phrases, so a space is where she breathes. Fragments
// too small to say alone (a short word, "SS", "PS2", a number) stay with a neighbour.
export function phrases(text) {
  const out = []
  for (const word of text.trim().split(/\s+/).filter(Boolean)) {
    const prev = out[out.length - 1]
    const tiny = (w) => [...w].length < 4 || /^[\x20-\x7e]+$/.test(w)
    if (prev && (tiny(word) || tiny(prev))) out[out.length - 1] = `${prev} ${word}`
    else out.push(word)
  }
  return out
}

async function speak(text) {
  const { tts } = await probe()
  const audio = getAudio()
  if (!tts || !audio || !soundOn()) return null
  try {
    const r = await fetch(`${API}/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout?.(12000),
    })
    if (!r.ok) return null
    return await audio.ctx.decodeAudioData(await r.arrayBuffer())
  } catch {
    return null
  }
}

// An original two-note "message received" chime (a single blip after the first).
function chime(first) {
  if (!soundOn()) return
  if (!first) return beep(1319, 0.08, 'sine', 0.035)
  beep(988, 0.09, 'sine', 0.05)
  setTimeout(() => beep(1319, 0.16, 'sine', 0.05), 90)
}

// Plays a voiced phrase through the master bus (so mute silences her); returns its length.
function play(buffer) {
  const audio = getAudio()
  if (!buffer || !audio) return 0
  const src = audio.ctx.createBufferSource()
  const gain = audio.ctx.createGain()
  gain.gain.value = 1.15
  src.buffer = buffer
  src.connect(gain).connect(audio.master)
  src.onended = () => {
    if (voice === src) voice = null
    src.disconnect()
    gain.disconnect()
  }
  src.start()
  voice = src
  return buffer.duration
}

const sleep = (s) => new Promise((r) => setTimeout(r, s * 1000))

async function run(event, detail) {
  const surroundings = syncSurroundings()
  if (!canReact(event, surroundings) || (detail.surroundings && surroundingsKey(detail.surroundings) !== surroundingsKey(surroundings))) return
  detail = { ...detail, surroundings }
  speakingIn = surroundingsKey(surroundings)
  busy = true
  const id = ++line
  voice?.stop()
  voice = null
  startTyping()
  try {
    let reply = await compose(event, detail)
    const now = syncSurroundings()
    if (id !== line) return
    // A slow LLM may answer after she has already emerged. Re-pick a grounded
    // fallback instead of claiming she is still inside (or already rescued).
    if (now.self.visible !== detail.surroundings.self.visible) {
      detail = { ...detail, surroundings: now }
      reply = fallbackLine(event, detail, recent)
    }
    const { text, face } = reply
    const parts = phrases(text)
    const spoken = []
    // every phrase is synthesised at once; each is played as soon as its turn comes
    const voices = parts.map((p) => speak(p))
    for (const [i, part] of parts.entries()) {
      const buffer = await voices[i]
      const here = syncSurroundings()
      if (id !== line) return
      if (i === 0 && here.self.visible !== detail.surroundings.self.visible) {
        cut(true)
        nudge(event, { ...detail, surroundings: here }, 2)
        return
      }
      sendMessage(part, face, i < parts.length - 1)
      // DeepSeek remembers only phrases she actually delivered, including a
      // partial shout cut off by a scene change, never a cancelled draft.
      spoken.push(part)
      if (i === 0) recent.push(part)
      else recent[recent.length - 1] = spoken.join(' ')
      if (recent.length > 8) recent.shift()
      chime(i === 0)
      const said = play(buffer) || 0.45 + [...part].length * 0.06
      await sleep(said + PAUSE)
      if (id !== line) return
    }
  } finally {
    if (id === line) {
      busy = false
      speakingIn = null
      set({ msgs: [], typing: false, activeBubble: null, spaceBubble: null,
        debris: state.stowaway && state.spaceBubble?.msgs.length ? collectBubble(state.spaceBubble) : state.debris,
        bubbles: state.bubbles.filter((b) => b.msgs.length) })
      quietUntil = Date.now() + GAP[0]
      if (pending) {
        const next = pending
        pending = null
        run(...next)
      }
    }
  }
}

// Clicking her cuts her off (and is itself worth a remark).
export function poke() {
  cut(true)
  nudge('poke', { note: 'the user clicked on you to shut you up' }, 2)
}
