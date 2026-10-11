import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { companionMiddleware } from './server/companion.js'

// น้องปลั๊ก's DeepSeek + Paxa voice proxy (server/companion.js). The keys come from
// functions/.env (the demo defaults) and root .env.local overrides stay in Node.
// Firebase serves the same API through its companion function.
const companion = (env) => ({
  name: 'companion-api',
  configureServer: (server) => void server.middlewares.use(companionMiddleware(env)),
  configurePreviewServer: (server) => void server.middlewares.use(companionMiddleware(env)),
})

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), companion({ ...loadEnv(mode, `${process.cwd()}/functions`, ''), ...loadEnv(mode, process.cwd(), '') })],
  // Lower syntax so older phones and in-app browsers can run it (no polyfills needed:
  // newer APIs are feature-checked in code).
  build: { target: ['es2019', 'chrome79', 'edge79', 'firefox78', 'safari13'] },
}))
