import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { test } from 'node:test'
import { companionMiddleware } from './companion.js'

async function request(api, path, body, chunks) {
  const req = new EventEmitter()
  Object.assign(req, { url: `/api/companion/${path}`, method: path === 'health' ? 'GET' : 'POST' })
  if (body !== undefined) req.body = body
  const headers = {}
  let data
  const res = { setHeader(key, value) { headers[key] = value }, end(value) { data = value } }
  const task = api(req, res, () => assert.fail('API request fell through'))
  if (chunks) {
    for (const chunk of chunks) req.emit('data', chunk)
    req.emit('end')
  }
  await task
  return { status: res.statusCode, headers, data }
}

test('Firebase parsed JSON and Vite streamed JSON produce the same upstream request', async () => {
  const original = globalThis.fetch
  const calls = []
  globalThis.fetch = async (_url, options) => {
    calls.push(JSON.parse(options.body))
    return { ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify({ text: 'ช่วยด้วย ฉันยังอยู่ในหลุมดำ', face: 'nervous', mode: 'own' }) } }] }) }
  }
  try {
    const api = companionMiddleware({ DEEPSEEK_API_KEY: 'mock' })
    const body = { event: 'l7:swallow', detail: { subject: 'buddy', surroundings: { self: { visible: false, motion: 'gone' } }, note: 'ภาษาไทย' } }
    const bytes = Buffer.from(JSON.stringify(body))
    const parsed = await request(api, 'say', body)
    const streamed = await request(api, 'say', undefined, [...bytes].map(byte => Buffer.from([byte])))
    assert.equal(parsed.status, 200)
    assert.equal(streamed.status, 200)
    assert.deepEqual(calls[0], calls[1])
    assert.deepEqual(calls[0].thinking, { type: 'disabled' })
    assert.equal(JSON.parse(parsed.data).face, 'nervous')
  } finally { globalThis.fetch = original }
})

test('reject malformed, non-object and oversized bodies without waiting for an ended stream', async () => {
  const api = companionMiddleware({ DEEPSEEK_API_KEY: 'mock' })
  for (const body of [null, [], '{invalid']) assert.equal((await request(api, 'say', body)).status, 400)
  assert.equal((await request(api, 'say', { text: 'ก'.repeat(6000) })).status, 413)
  assert.equal((await request(api, 'say', undefined, [Buffer.alloc(16001)])).status, 413)
})

test('health and missing-key fallbacks work without making upstream requests', async () => {
  const api = companionMiddleware({})
  const health = await request(api, 'health')
  assert.deepEqual(JSON.parse(health.data), { llm: false, tts: false })
  assert.equal((await request(api, 'say', {})).status, 503)
  assert.equal((await request(api, 'tts', { text: 'ทดสอบ' })).status, 503)
})

test('Firebase TTS requests forward and cache the actual audio bytes', async () => {
  const original = globalThis.fetch
  let calls = 0
  globalThis.fetch = async (_url, options) => {
    calls++
    assert.equal(JSON.parse(options.body).voice, 'bualoi')
    return { ok: true, arrayBuffer: async () => Uint8Array.of(73, 68, 51).buffer }
  }
  try {
    const api = companionMiddleware({ PAXA_API_KEY: 'mock' })
    for (let i = 0; i < 2; i++) {
      const result = await request(api, 'tts', { text: 'ทดสอบ' })
      assert.equal(result.status, 200)
      assert.equal(result.headers['Content-Type'], 'audio/mpeg')
      assert.deepEqual(result.data, Buffer.from('ID3'))
    }
    assert.equal(calls, 1)
  } finally { globalThis.fetch = original }
})
