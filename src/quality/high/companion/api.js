import { createChatBody, parseChatReply } from '../../../../functions/companion-protocol.js'

const API = '/api/companion'
const base = (url, fallback) => (url || fallback).replace(/\/$/, '')

// The demo build calls the services directly with the user's throwaway keys.
// Development and the optional backend build continue to use the shared proxy.
export function createCompanionApi(demo = globalThis.__ILEAK_COMPANION_DEMO__, request = fetch) {
  let backend
  const cache = new Map()
  const health = () => demo
    ? Promise.resolve({ llm: !!demo.llm?.key, tts: !!demo.tts?.key })
    : (backend ??= request(`${API}/health`, { signal: AbortSignal.timeout?.(3000) })
      .then((r) => (r.ok && r.headers.get('content-type')?.includes('json') ? r.json() : {}))
      .then((h) => ({ llm: !!h.llm, tts: !!h.tts }))
      .catch(() => ({ llm: false, tts: false })))

  const post = async (url, body, key, timeout) => {
    const response = await request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(key ? { Authorization: `Bearer ${key}` } : {}) },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout?.(timeout),
    })
    if (!response.ok) throw new Error(`companion API ${response.status}`)
    return response
  }

  const say = async (body) => {
    if (!demo) return (await post(`${API}/say`, body, null, 9000)).json()
    const llm = demo.llm
    const result = await post(`${base(llm?.base, 'https://api.deepseek.com')}/chat/completions`, createChatBody(body, llm?.model), llm?.key, 12000)
    return parseChatReply(await result.json())
  }

  const tts = (text) => {
    if (!demo) return post(`${API}/tts`, { text }, null, 12000).then((r) => r.arrayBuffer())
    if (cache.has(text)) return cache.get(text).then((buffer) => buffer.slice(0))
    const voice = demo.tts
    const audio = post(`${base(voice?.base, 'https://api.paxalabs.com')}/v1/tts`,
      { text, voice: voice?.voice || 'bualoi', model: voice?.model || 'paxa-tts-flash-v1' }, voice?.key, 12000)
      .then((r) => r.arrayBuffer())
      .catch((error) => { cache.delete(text); throw error })
    if (cache.size >= 200) cache.delete(cache.keys().next().value)
    cache.set(text, audio)
    // decodeAudioData takes ownership of its input; preserve cached bytes.
    return audio.then((buffer) => buffer.slice(0))
  }

  return { health, say, tts }
}
