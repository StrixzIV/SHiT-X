import { useState } from 'react'
import { appleModel } from '../appraisal/devices.js'
import { beep } from '../fx/sfx.js'

// iOS gives websites no charging state, no USB, nothing — in every browser,
// because they're all WebKit underneath. So we don't pretend.
const EXCUSES = [
  'Apple ไม่ยอมให้เว็บรู้ว่าเครื่องกำลังชาร์จ ต่อให้จุ่มทั้งเครื่องลงน้ำก็ไม่บอก',
  'Chrome บน iPhone ก็คือ Safari ใส่วิก เปลี่ยนเบราว์เซอร์ไปก็ไม่ช่วย',
  'iPhone ของท่านหรูเกินกว่าจะยอมเปิดเผยข้อมูลให้คนธรรมดาอย่างเรา',
  'ระบบได้ส่งคำร้องไปยัง Apple แล้ว คาดว่าจะได้รับคำตอบภายใน 3–5 ปีทำการ',
  'อุปกรณ์ของท่านปลอดภัยจากไฟรั่วโดยสมบูรณ์ เพราะมันไม่บอกอะไรเราเลย',
]

const APPEALS = [
  'คำร้องถูกปฏิเสธโดยฝ่ายตรวจสอบ App Store (เหตุผล: ไม่มีเหตุผล)',
  'กรุณาชำระค่าธรรมเนียมอุทธรณ์ 30% ก่อน',
  'ระบบได้ส่งเรื่องให้ Tim Cook แล้ว เขาอ่านแล้ว (ไม่ตอบ)',
  'อุทธรณ์ไม่ผ่าน ลองซื้อ Android ที่ชาร์จ 240 W ดูไหม',
  'กรุณาเสียบสาย Lightning แล้วลองใหม่ (ล้อเล่น ตอนนี้ USB-C แล้ว ก็ยังไม่ได้อยู่ดี)',
]

const pick = (list) => list[Math.floor(Math.random() * list.length)]

export default function IosBlock() {
  const [excuse] = useState(() => pick(EXCUSES))
  const [appeal, setAppeal] = useState(null)
  const [copied, setCopied] = useState(false)
  const model = appleModel()?.model?.replace(' (เดาจากขนาดจอ)', '') ?? 'iPhone / iPad'

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: 'iLeak', text: 'เปิดบนคอมหรือ Android แทนนะ', url: location.href })
      else {
        await navigator.clipboard.writeText(location.href)
        setCopied(true)
      }
    } catch { /* user cancelled */ }
  }

  return (
    <main className="ios-block">
      <div className="ios-apple" aria-hidden>🍎</div>
      <span className="eyebrow">ตรวจพบ {model}</span>
      <h1>เสียใจด้วยนะ ชาว iOS</h1>
      <p className="ios-lead">แอปนี้ใช้กับ iPhone และ iPad ไม่ได้จ้า <b>โชคไม่ดีเลยเนอะ</b> 🫠</p>
      <p className="ios-excuse">{excuse}</p>

      <div className="ios-actions">
        <button type="button" className="btn-gold" onClick={share}>
          {copied ? 'คัดลอกลิงก์แล้ว' : 'ส่งลิงก์ไปเปิดบนคอม / Android'}
        </button>
        <button
          type="button"
          className="btn-line"
          onClick={() => {
            beep(160, 0.4, 'square', 0.12, 80)
            setAppeal(pick(APPEALS.filter((a) => a !== appeal)))
          }}
        >
          ยื่นอุทธรณ์
        </button>
      </div>
      {appeal && <p key={appeal} className="ios-appeal">❌ {appeal}</p>}

      <p className="ios-fine">
        เรื่องจริง: ในไทยทุกเบราว์เซอร์บน iPhone / iPad ใช้เอนจิน WebKit ของ Apple ซึ่งไม่ให้เว็บอ่านสถานะชาร์จ, USB, Serial, HID หรือ MIDI เลย เราจึงประเมินอะไรไม่ได้
      </p>
    </main>
  )
}
