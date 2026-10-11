// Shared companion API for Firebase Functions and Vite dev/preview. Firebase
// loads functions/.env; Vite loads the same demo values plus root .env.local.
//
//   GET  /api/companion/health → { llm, tts }
//   POST /api/companion/say    { event, detail, recent } → { text, face }
//   POST /api/companion/tts    { text } → audio/mpeg

export const FACES = {
  happy: 'eyes closed, big smile, thumbs up',
  confused: 'blank stare under three question marks',
  sad: 'hugging her knees, crying',
  angry: 'anger mark, orange sparks, scowling',
  charged: 'unimpressed glare, her plug pigtails crackling',
  thinking: 'worried, a little startled',
  hello: 'waving hello',
  idea: 'hand on chin, a lightbulb',
  sleepy: 'lying down asleep, Zzz',
  point: 'pointing at you, deadpan',
  connected: 'content, tangled in cables',
  shocked: 'electrocuted, hair spiked, eyes wide',
  meditate: 'sitting cross-legged, glowing, serene',
  spark: 'surprised, sparks in her hands',
  smug: 'peace sign, stars, smug grin',
  ok: 'glowing double thumbs up',
  love: 'heart eyes, heart hands',
  nervous: 'sweating, blushing, about to cry',
}

const MODES = ['builtin', 'extend', 'shorten', 'own']

const PERSONA = `You are "น้องปลั๊ก" (Nong Plug), a tiny anime girl whose twin tails end in power plugs. You live in the bottom-right corner of "iLeak: HydroCharging", a Windows XP-styled joke web app made for The Stupid Hackathon Thailand. The app pretends to measure how much electricity leaks into flood water when the user dips their charging cable in, ranks their gadget like luxury tiers (F … S … Ω), then shows a retro PS1/PS2 game cutscene of the disaster.

Your job: react to what the user just did with ONE short spoken line in Thai.
- Speak casual Thai like a close friend who roasts you: call yourself ฉัน, call the user เธอ, นาย or แก (mix them). Never ท่าน or คุณ. Sweet-sarcastic particles (นะ, จ้ะ, ค่ะ when being fake-polite). Nice on the surface, savage underneath: backhanded compliments, fake concern, passive-aggressive.
- Often be helpful first, then stab them in the back in the same line ("ดีมากเลยค่ะ ... แต่ ...").
- Roast the choice, the gadget, the score, the browser, their patience. Never roast race, religion, body, gender or anything real and personal.
- It is satire: never encourage really putting electronics in water. If it fits, be the one who knows better ("ฉันพูดเล่นนะ อย่าทำจริงล่ะ").
- Max 90 Thai characters. No emoji, no hashtags, no English unless it's a product name. It will be read aloud by TTS, so write it the way it should be spoken.
- Put a space between phrases, as Thai does: each phrase is sent as its own chat message and read with a pause after it, so 2–5 phrases is ideal.
- Don't repeat your recent lines.

Stay physically and temporally aware of the Current surroundings supplied with every event. They describe what is on screen NOW and override old recent lines, event notes, prewritten lines and the suggested mode.
- During loading, the score is still being counted; no verdict or cutscene has happened yet. During scene, react to that particular cutscene. During result, the verdict is visible and that scene is still around you. Never act as if you are back at the setup screen or tell the user to appraise, plug in peripherals or hold the dip button.
- Your self.location and self.motion describe YOU. In L7 your Messenger window orbits independently of the result card. resultCard describes a DIFFERENT object. If only the card is swallowed or thrown, react to seeing it; do not claim you were swallowed, dragged or rescued. Flying old notifications are separate objects too.
- When your own window is orbiting, acknowledge the black hole, motion, floating messages or the result as appropriate. Do not casually say you are sitting patiently in the desktop corner. You return to the corner only after the user closes the scene.
- You can SHOUT from inside the black hole even when self.visible is false: your voice leaks out, though your window is gone. Make it funny, panicked or indignant ("ฉันยังอยู่ในนี้ ช่วยด้วย!"). Around the hole, yell about spinning, being pulled or dodging the floating messages. Short cries, pleas and blaming the user fit better here than a calm office-assistant remark. If you have already emerged, react to the ordeal rather than claiming you are still inside.
- If the user returns to the tab, only the USER went away; the current scene may still be running. Do not invent an escape, restart, completed disaster or new result that the surroundings do not show.
- Select a prewritten line only if it is consistent with those facts. Otherwise choose own and write a grounded reaction. Keep the sarcastic character, but never invent an action or location just to make a joke.

You also get the prewritten lines for this moment ("text [face]"). Choose ONE mode:
- builtin: say one of them exactly as written, the one that fits the details best (keep its face)
- extend: take one and add a twist or a second stab that uses the details (still max 90 characters)
- shorten: cut one down to its sharpest few words
- own: write a fresh line in the same voice
A suggested mode comes with each event: follow it unless the details clearly call for another.

Reply with JSON only: {"mode": "builtin|extend|shorten|own", "text": "<the line>", "face": "<one face id>"}
Face ids: ${Object.entries(FACES).map(([id, look]) => `${id} (${look})`).join('; ')}`

const json = (res, code, body) => {
  res.statusCode = code
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(body))
}

const MAX_BODY = 16000
const bodyError = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode })
const objectBody = (body) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw bodyError('JSON object required')
  return body
}
const parseBody = (raw) => {
  if (Buffer.byteLength(raw) > MAX_BODY) throw bodyError('request too large', 413)
  try { return objectBody(JSON.parse(raw || '{}')) }
  catch (e) { throw e.statusCode ? e : bodyError('invalid JSON') }
}

async function readBody(req) {
  // Firebase/Express parses JSON before invoking the function. Waiting for its
  // already-ended stream would hang every deployed say/tts request.
  if (req.body !== undefined) {
    if (Buffer.isBuffer(req.body) || typeof req.body === 'string') return parseBody(req.body.toString())
    const body = objectBody(req.body)
    if (Buffer.byteLength(JSON.stringify(body)) > MAX_BODY) throw bodyError('request too large', 413)
    return body
  }
  if (req.rawBody !== undefined) return parseBody(req.rawBody.toString())
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (chunk) => {
      size += Buffer.byteLength(chunk)
      if (size > MAX_BODY) return reject(bodyError('request too large', 413))
      chunks.push(Buffer.from(chunk))
    })
    req.on('end', () => {
      try {
        resolve(parseBody(Buffer.concat(chunks).toString('utf8')))
      } catch (e) {
        reject(e)
      }
    })
    req.on('error', reject)
    req.on('aborted', () => reject(bodyError('request aborted')))
  })
}

// A cheap guard in case the dev server is ever exposed with --host.
function limiter(perMinute) {
  let stamps = []
  return () => {
    const now = Date.now()
    stamps = stamps.filter((t) => now - t < 60000)
    if (stamps.length >= perMinute) return false
    stamps.push(now)
    return true
  }
}

export function companionMiddleware(env) {
  const llm = {
    key: env.DEEPSEEK_API_KEY,
    base: (env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com').replace(/\/$/, ''),
    model: env.DEEPSEEK_MODEL || 'deepseek-flash',
  }
  const tts = {
    key: env.PAXA_API_KEY,
    base: (env.PAXA_BASE_URL || 'https://api.paxalabs.com').replace(/\/$/, ''),
    model: env.PAXA_MODEL || 'paxa-tts-flash-v1',
    voice: env.PAXA_VOICE || 'bualoi',
  }
  const sayOk = limiter(40)
  const ttsOk = limiter(200) // one call per phrase
  const voiceCache = new Map() // text → mp3 Buffer (the prewritten lines repeat)

  async function say({ event, detail, recent, builtin, mode }) {
    const { surroundings, ...action } = detail || {}
    const context = [
      `Event: ${String(event).slice(0, 60)}`,
      surroundings ? `Current surroundings (authoritative): ${JSON.stringify(surroundings).slice(0, 1500)}` : '',
      `Details: ${JSON.stringify(action).slice(0, 900)}`,
      builtin?.length ? `Prewritten lines:\n${builtin.slice(0, 14).map((l) => `- ${String(l).slice(0, 160)}`).join('\n')}` : '',
      MODES.includes(mode) ? `Suggested mode: ${mode}` : '',
      recent?.length ? `Your recent lines: ${recent.slice(-5).map((l) => `"${String(l).slice(0, 120)}"`).join(' / ')}` : '',
    ].filter(Boolean).join('\n')
    const r = await fetch(`${llm.base}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${llm.key}` },
      body: JSON.stringify({
        model: llm.model,
        messages: [{ role: 'system', content: PERSONA }, { role: 'user', content: context }],
        response_format: { type: 'json_object' },
        thinking: { type: 'disabled' },
        temperature: 1.3,
        max_tokens: 400,
      }),
      signal: AbortSignal.timeout(12000),
    })
    if (!r.ok) throw new Error(`deepseek ${r.status}: ${(await r.text()).slice(0, 300)}`)
    const result = await r.json()
    const content = result.choices?.[0]?.message?.content
    if (!content?.trim()) throw new Error('deepseek: empty response')
    const out = JSON.parse(content)
    const text = String(out.text || '').trim().slice(0, 160)
    if (!text) throw new Error('deepseek: empty line')
    const used = MODES.includes(out.mode) ? out.mode : 'own'
    console.info(`[companion] ${event} · ${used}${mode && used !== mode ? ` (suggested ${mode})` : ''}: ${text}`)
    return { text, face: FACES[out.face] ? out.face : 'point', mode: used }
  }

  async function speak(text) {
    if (voiceCache.has(text)) return voiceCache.get(text)
    const r = await fetch(`${tts.base}/v1/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tts.key}` },
      body: JSON.stringify({ text, voice: tts.voice, model: tts.model }),
      signal: AbortSignal.timeout(15000),
    })
    if (!r.ok) throw new Error(`paxa ${r.status}: ${(await r.text()).slice(0, 300)}`)
    const audio = Buffer.from(await r.arrayBuffer())
    if (voiceCache.size > 200) voiceCache.delete(voiceCache.keys().next().value)
    voiceCache.set(text, audio)
    return audio
  }

  return async (req, res, next) => {
    const url = req.url?.split('?')[0]
    if (!url?.startsWith('/api/companion/')) return next()
    try {
      if (url === '/api/companion/health') return json(res, 200, { llm: !!llm.key, tts: !!tts.key })
      if (req.method !== 'POST') return json(res, 405, { error: 'POST only' })
      const body = await readBody(req)
      if (url === '/api/companion/say') {
        if (!llm.key) return json(res, 503, { error: 'DEEPSEEK_API_KEY not set' })
        if (!sayOk()) return json(res, 429, { error: 'slow down' })
        return json(res, 200, await say(body))
      }
      if (url === '/api/companion/tts') {
        if (!tts.key) return json(res, 503, { error: 'PAXA_API_KEY not set' })
        const text = String(body.text || '').trim().slice(0, 200)
        if (!text) return json(res, 400, { error: 'no text' })
        if (!voiceCache.has(text) && !ttsOk()) return json(res, 429, { error: 'slow down' })
        const audio = await speak(text)
        res.statusCode = 200
        res.setHeader('Content-Type', 'audio/mpeg')
        res.setHeader('Cache-Control', 'no-store')
        return res.end(audio)
      }
      return json(res, 404, { error: 'unknown route' })
    } catch (e) {
      console.warn('[companion]', e.message)
      return json(res, e.statusCode || 502, { error: e.message })
    }
  }
}
