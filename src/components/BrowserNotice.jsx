import { detectBrowser, escapeInApp } from '../appraisal/devices.js'

// What actually breaks (MDN browser-compat-data 8.1.5):
// - Android in-app browsers are System WebView: the battery works, WebUSB / Serial / HID
//   don't, and the host app decides whether the mic and camera are allowed.
// - iOS in-app browsers are WKWebView: same limits as Safari, plus the app's mic/camera policy.
// - Plain http: battery (Chrome 103+), USB, Serial, MIDI, mic, camera and gamepads are all off.
export default function BrowserNotice() {
  const b = detectBrowser()
  const out = escapeInApp(b)
  const insecure = !window.isSecureContext

  if (!out && !insecure) return null
  return (
    <div className="browser-notice" role="note">
      {out && (
        <p>
          ⚠️ กำลังเปิดใน{b.label}:{' '}
          {b.ios ? 'แอปอาจไม่ให้ใช้ไมค์และกล้อง' : 'อ่านแบตได้ แต่ USB / Serial ใช้ไม่ได้ และแอปอาจไม่ให้ใช้ไมค์และกล้อง'} —{' '}
          {out.href ? <a href={out.href}>{out.text}</a> : <b>{out.text}</b>}
        </p>
      )}
      {insecure && <p>⚠️ เปิดผ่าน http:// — เบราว์เซอร์ปิดแบต USB Serial MIDI ไมค์ กล้อง และจอยเกม จนกว่าจะเปิดผ่าน https หรือ localhost</p>}
    </div>
  )
}
