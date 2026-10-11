// Shared companion API for Firebase Functions and Vite dev/preview. Firebase
// loads functions/.env; Vite loads the same demo values plus root .env.local.
//
//   GET  /api/companion/health → { llm, tts }
//   POST /api/companion/say    { event, detail, recent } → { text, face }
//   POST /api/companion/tts    { text } → audio/mpeg

import { createChatBody, parseChatReply } from './companion-protocol.js'
export { FACES } from './companion-protocol.js'

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
    const r = await fetch(`${llm.base}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${llm.key}` },
      body: JSON.stringify(createChatBody({ event, detail, recent, builtin, mode }, llm.model)),
      signal: AbortSignal.timeout(12000),
    })
    if (!r.ok) throw new Error(`deepseek ${r.status}: ${(await r.text()).slice(0, 300)}`)
    const reply = parseChatReply(await r.json())
    console.info(`[companion] ${event} · ${reply.mode}${mode && reply.mode !== mode ? ` (suggested ${mode})` : ''}: ${reply.text}`)
    return reply
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
