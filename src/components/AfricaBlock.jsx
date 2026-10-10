import { useState } from 'react'
import { beep } from '../fx/sfx.js'

const EXCUSES = [
  "ระบบตรวจพบว่าภูมิภาคของท่านไม่มีน้ำท่วม เว็บไซต์นี้จึงไม่มีประโยชน์สำหรับภูมิภาคของท่าน",
  "iLeak ออกแบบมาเพื่อตรวจไฟรั่วในน้ำท่วม หากไม่มีน้ำท่วมจะเอาสาย USB-C ไปจุ่มอะไร?",
  "พยากรณ์อากาศแจ้งว่าแถบนี้แดดออก ปลอดภัยสนิท ไม่มีเหตุให้ต้องจุ่มสายชาร์จ",
  "สาย USB-C ของเราไม่รองรับการทำงานบนพื้นดินแห้ง กรุณารอน้ำท่วมก่อนใช้งาน",
]

const APPEALS = [
  "คำร้องถูกปฏิเสธ: แดดยังเปรี้ยงอยู่เลย ไม่มีน้ำท่วมสักหยด",
  "ระบบตรวจสอบแล้ว: ไม่มีน้ำท่วมให้ตรวจไฟรั่ว ไปเปิดแอร์นอนเถอะ",
  "อุทธรณ์ไม่ผ่าน: กรุณารอฤดูมรสุมหรือท่อประปาแตกแล้วลองใหม่",
  "ตรวจพบความพยายามต่อต้าน: คุณใช้ VPN หรือเปล่า? เราจับตาดูอยู่นะ",
]

const pick = (list) => list[Math.floor(Math.random() * list.length)]

export default function AfricaBlock({ country = 'Africa' }) {
  const [excuse] = useState(() => pick(EXCUSES))
  const [appeal, setAppeal] = useState(null)
  const [copied, setCopied] = useState(false)

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'iLeak - Region Not Flooded',
          text: "Your region doesn't have floods. This website isn't useful for your region.",
          url: location.href,
        })
      } else {
        await navigator.clipboard.writeText(location.href)
        setCopied(true)
      }
    } catch {
      /* user cancelled */
    }
  }

  return (
    <main className="ios-block">
      <div className="ios-apple" aria-hidden style={{ animation: 'none', filter: 'none' }}>
        ☀️🏖️
      </div>
      <span className="eyebrow" style={{ color: '#f87171' }}>
        403 FORBIDDEN • ตรวจพบภูมิภาค: {country}
      </span>
      <h1>
        Your region doesn't have floods.
        <br />
        <span style={{ color: 'var(--gold-hi)', fontSize: '0.85em' }}>
          This website isn't useful for your region.
        </span>
      </h1>
      <p className="ios-lead">
        แอปนี้สร้างมาเพื่อตรวจไฟรั่วในน้ำท่วมเท่านั้น <b>ภูมิภาคของท่านแห้งเกินไป</b> 🏜️
      </p>
      <p className="ios-excuse">{excuse}</p>

      <div className="ios-actions">
        <button type="button" className="btn-gold" onClick={share}>
          {copied ? 'คัดลอกข้อความแล้ว' : 'แชร์สถานะ'}
        </button>
        <button
          type="button"
          className="btn-line"
          onClick={() => {
            beep(160, 0.4, 'square', 0.12, 80)
            setAppeal(pick(APPEALS.filter((a) => a !== appeal)))
          }}
        >
          ยื่นอุทธรณ์ขอน้ำท่วม
        </button>
      </div>
      {appeal && (
        <p key={appeal} className="ios-appeal">
          ❌ {appeal}
        </p>
      )}

      <p className="ios-fine">
        HTTP 403: iLeak requires active flood conditions to test live power leaks via USB-C. Access is restricted for Africa regions.
      </p>
    </main>
  )
}
