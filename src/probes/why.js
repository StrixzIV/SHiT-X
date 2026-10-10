// Shared facts for "why can't this card work here" messages.
// Sources: MDN browser-compat-data 8.1.5, Firefox 151 notes, Brave wiki (see ARCHITECTURE.md "Fact check").
import { detectBrowser } from '../appraisal/devices.js'

export const browser = detectBrowser()
export const insecure = typeof window !== 'undefined' && !window.isSecureContext
export const HTTPS = 'ต้องเปิดผ่าน https หรือ localhost (บน http เบราว์เซอร์ปิดไว้)'
export const chromeMajor = +(navigator.userAgent.match(/(?:Chrome|CriOS)\/(\d+)/)?.[1] ?? 0)
// Firefox gates Web Serial and Web MIDI behind a one-click "site permission add-on" prompt.
export const FIREFOX_ADDON = browser.engine === 'Gecko' ? ' (Firefox จะขอติดตั้ง add-on อนุญาตก่อน)' : ''
