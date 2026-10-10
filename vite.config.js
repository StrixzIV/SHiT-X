import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Lower syntax so older phones and in-app browsers can run it (no polyfills needed:
  // newer APIs are feature-checked in code).
  build: { target: ['es2019', 'chrome79', 'edge79', 'firefox78', 'safari13'] },
})
