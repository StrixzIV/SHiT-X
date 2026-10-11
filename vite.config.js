import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { companionMiddleware } from './server/companion.js'

// น้องปลั๊ก's DeepSeek + Paxa voice proxy (server/companion.js).
// functions/.env supplies demo defaults and root .env.local supplies overrides.
// Only --mode demo embeds the explicitly approved throwaway provider keys.
const companion = (env) => ({
  name: 'companion-api',
  configureServer: (server) => void server.middlewares.use(companionMiddleware(env)),
  configurePreviewServer: (server) => void server.middlewares.use(companionMiddleware(env)),
})

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, `${process.cwd()}/functions`, ''), ...loadEnv(mode, process.cwd(), '') }
  const demo = mode === 'demo' ? {
    llm: { key: env.DEEPSEEK_API_KEY, base: env.DEEPSEEK_BASE_URL, model: env.DEEPSEEK_MODEL },
    tts: { key: env.PAXA_API_KEY, base: env.PAXA_BASE_URL, model: env.PAXA_MODEL, voice: env.PAXA_VOICE },
  } : null
  return {
    plugins: [react(), companion(env)],
    define: { 'globalThis.__ILEAK_COMPANION_DEMO__': JSON.stringify(demo) },
    // Lower syntax so older phones and in-app browsers can run it (no polyfills needed:
    // newer APIs are feature-checked in code).
    build: { target: ['es2019', 'chrome79', 'edge79', 'firefox78', 'safari13'] },
  }
})
