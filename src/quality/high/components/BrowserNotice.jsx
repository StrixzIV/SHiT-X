import { detectBrowser, escapeInApp } from '../../../appraisal/devices.js'

// In-app browsers (LINE, Facebook, IG, TikTok…) and plain http both switch off
// most sensors. Say so up front and offer a way out.
export default function BrowserNotice() {
  const b = detectBrowser()
  const out = escapeInApp(b)
  const insecure = !window.isSecureContext

  if (!out && !insecure) return null
  return (
    <div className="browser-notice" role="note">
      {out && (
        <p>
          ⚠️ กำลังเปิดใน{b.label} ซึ่งปิดเซ็นเซอร์แบต ไมค์ และ USB ไว้ —{' '}
          {out.href ? <a href={out.href}>{out.text}</a> : <b>{out.text}</b>}
        </p>
      )}
      {insecure && <p>⚠️ เปิดผ่าน http:// — เบราว์เซอร์ปิดเซ็นเซอร์แบต ไมค์ และ USB ให้เปิดผ่าน https หรือ localhost</p>}
    </div>
  )
}
