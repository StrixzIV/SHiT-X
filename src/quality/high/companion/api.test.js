import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createCompanionApi } from './api.js'

const demo = { llm: { key: 'test-llm', model: 'deepseek-flash' }, tts: { key: 'test-tts', voice: 'bualoi' } }
const action = { event: 'l7:swallow', detail: { subject: 'buddy', surroundings: { screen: 'calculation', phase: 'result', level: 7, self: { location: 'independent-window-in-space', visible: false } } }, recent: ['ก่อนหน้า'], builtin: ['ช่วยด้วย [nervous]'], mode: 'own' }

test('static demo sends the actual scene and persona directly to DeepSeek without /api', async () => {
  const calls = []
  const api = createCompanionApi(demo, async (url, options) => {
    calls.push({ url, options })
    return { ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify({ text: 'ฉันยังอยู่ในนี้ ช่วยด้วย', face: 'nervous', mode: 'own' }) } }] }) }
  })
  assert.deepEqual(await api.health(), { llm: true, tts: true })
  assert.equal(calls.length, 0, 'demo does not probe a nonexistent backend')
  const reply = await api.say(action)
  assert.equal(reply.face, 'nervous')
  assert.equal(calls[0].url, 'https://api.deepseek.com/chat/completions')
  assert.equal(calls[0].options.headers.Authorization, 'Bearer test-llm')
  const body = JSON.parse(calls[0].options.body)
  assert.deepEqual(body.thinking, { type: 'disabled' })
  assert(body.messages[0].content.includes('DIFFERENT object'))
  assert(body.messages[1].content.includes('independent-window-in-space'))
})

test('static demo sends Paxa voice settings and gives each cached decode its own bytes', async () => {
  const calls = []
  const api = createCompanionApi(demo, async (url, options) => {
    calls.push({ url, options })
    return { ok: true, arrayBuffer: async () => Uint8Array.of(73, 68, 51).buffer }
  })
  const first = await api.tts('ทดสอบ')
  const transferred = structuredClone(first, { transfer: [first] })
  assert.equal(first.byteLength, 0)
  const second = await api.tts('ทดสอบ')
  assert.deepEqual(new Uint8Array(second), new Uint8Array(transferred))
  assert.equal(calls.length, 1)
  assert.equal(calls[0].url, 'https://api.paxalabs.com/v1/tts')
  assert.deepEqual(JSON.parse(calls[0].options.body), { text: 'ทดสอบ', voice: 'bualoi', model: 'paxa-tts-flash-v1' })
  assert.equal(calls[0].options.headers.Authorization, 'Bearer test-tts')
})

test('failed direct requests can retry and cannot poison the voice cache', async () => {
  let count = 0
  const api = createCompanionApi(demo, async () => ++count === 1
    ? { ok: false, status: 503 }
    : { ok: true, arrayBuffer: async () => new ArrayBuffer(3) })
  await assert.rejects(api.tts('ทดสอบ'))
  assert.equal((await api.tts('ทดสอบ')).byteLength, 3)
  assert.equal(count, 2)
})

test('backend build keeps the existing proxy and static-only fallback', async () => {
  const urls = []
  const api = createCompanionApi(null, async (url) => {
    urls.push(url)
    return { ok: true, headers: { get: () => 'application/json' }, json: async () => url.endsWith('health') ? { llm: true, tts: true } : { text: 'ทดสอบ', face: 'point' }, arrayBuffer: async () => new ArrayBuffer(3) }
  })
  await api.health(); await api.health(); await api.say(action); await api.tts('ทดสอบ')
  assert.deepEqual(urls, ['/api/companion/health', '/api/companion/say', '/api/companion/tts'])
  const staticApi = createCompanionApi(null, async () => ({ ok: true, headers: { get: () => 'text/html' } }))
  assert.deepEqual(await staticApi.health(), { llm: false, tts: false })
})
