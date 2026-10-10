import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, BookOpen, Check, ShieldAlert } from 'lucide-react'
import { beep } from '../fx/sfx.js'

// Shown on every load. Facts unlock one at a time and each one has to sit on
// screen long enough to be read; then every safety box and the consent.
const FACTS = [
  ['กฎฟิสิกส์พื้นฐานเรื่องมวลน้ำ', '"น้ำเปียกเสมอ หากระดับน้ำสูงขึ้นแปลว่ามีน้ำเพิ่มขึ้น" และหากน้ำท่วมมิดหัวเข่า แปลว่าท่านไม่สามารถเดินแบบเท้าแห้งได้อีกต่อไป'],
  ['การนำไฟฟ้าของน้ำลาดกระบัง', 'น้ำฝนบริสุทธิ์ไม่นำไฟฟ้า แต่น้ำท่วมขังอุดมไปด้วยแคลเซียม ดินตะกอน ขยะเปียก และเศษปลั๊กพ่วง จึงนำไฟดีกว่าทองแดงบริสุทธิ์ 12 เท่า'],
  ['ทฤษฎีการตรวจจับด้วยสายชาร์จ', 'พอร์ต USB-C มี 24 พิน หากมีไฟ 220V รั่วในน้ำ พิน VBUS จะรับไอออนอิสระเข้าสู่วงจรชาร์จ ทำให้โทรศัพท์เริ่มชาร์จเองอย่างน่าอัศจรรย์'],
  ['ลำดับชั้นทางพลังงาน', 'อุปกรณ์ที่ใช้หัวชาร์จวัตต์สูงย่อมตรวจไฟรั่วได้แม่นยำกว่า เพราะความหรูหรามีค่าความนำไฟฟ้าสูงกว่าความยากจน (อ้างอิง: ไม่มี)'],
  ['สมการไฮโดร-อิเล็กทริก', 'V_leak = (วัตต์ × ระดับชั้น × อุปกรณ์ต่อพ่วง) ÷ สติสัมปชัญญะ — เมื่อสติเข้าใกล้ศูนย์ ผลลัพธ์จะเข้าใกล้อนันต์'],
]

const CHECKS = [
  ['สับคัตเอาต์ / เบรกเกอร์หลักลงแล้ว', 'เฉพาะกรณีที่ตู้ยังไม่จมน้ำ หากตู้จมแล้ว ห้ามแตะเด็ดขาด ให้วิ่งขึ้นชั้นสอง'],
  ['ถอดปลั๊กเครื่องใช้ไฟฟ้าทุกจุดแล้ว', 'โดยเฉพาะพัดลมตั้งพื้นบนพื้นเปียก และปลั๊กสามตาที่ลอยน้ำอยู่เหมือนกระทง'],
  ['สวมรองเท้าบูทยางหรือยืนบนกะละมังแล้ว', 'เพื่อให้กระแสไฟเลือกไหลลงสายชาร์จแทนร่างกายมนุษย์ ตามหลักไบโอฟิสิกส์'],
]

const readSeconds = (text) => Math.min(4, Math.max(2, Math.round(text.length / 30)))

function Fact({ index, title, body, done, onRead }) {
  const [left, setLeft] = useState(readSeconds(body))
  const ref = useRef(null)
  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const t = setInterval(() => setLeft((n) => (n > 0 ? n - 1 : 0)), 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <article ref={ref} className={`gate-fact ${done ? 'done' : ''}`}>
      <span className="gate-n">{String(index + 1).padStart(2, '0')}</span>
      <div>
        <h3>{title}</h3>
        <p>{body}</p>
        {!done && (
          <button type="button" className="gate-read" disabled={left > 0} onClick={onRead}>
            {left > 0 ? `กรุณาอ่านให้จบ (${left})` : 'อ่านและเข้าใจแล้ว'}
          </button>
        )}
      </div>
      {done && <Check className="gate-tick" />}
    </article>
  )
}

export default function AgreementGate({ onAccept, dev }) {
  const [read, setRead] = useState(0)
  const [checks, setChecks] = useState(() => CHECKS.map(() => false))
  const [consent, setConsent] = useState(false)
  const allRead = read >= FACTS.length
  const ready = allRead && checks.every(Boolean) && consent

  return (
    <div className="gate" role="dialog" aria-modal="true" aria-labelledby="gate-title">
      <div className="gate-sheet">
        <header className="gate-head">
          <span className="eyebrow">ข้อตกลงก่อนใช้บริการ · บังคับอ่านทุกครั้ง</span>
          <h1 id="gate-title">iLeak <em>Prestige</em></h1>
          <p>ระบบประเมินไฟรั่วในน้ำท่วม สำหรับผู้มีอุปกรณ์ระดับสูง ท่านต้องอ่านข้อเท็จจริงทุกข้อและยินยอมก่อนเข้าใช้งาน</p>
          {dev && <button type="button" className="btn-line dev-skip" onClick={onAccept}>ข้าม (dev)</button>}
        </header>

        <section>
          <h2><BookOpen size={18} /> ข้อเท็จจริงทางวิชาการ <small>{Math.min(read, FACTS.length)}/{FACTS.length}</small></h2>
          {FACTS.slice(0, read + 1).map(([t, b], i) => (
            <Fact key={t} index={i} title={t} body={b} done={i < read} onRead={() => { beep(660 + i * 80, 0.08, 'triangle'); setRead(i + 1) }} />
          ))}
        </section>

        {allRead && (
          <section className="gate-safety">
            <h2><ShieldAlert size={18} /> มาตรการความปลอดภัย</h2>
            {CHECKS.map(([t, d], i) => (
              <label key={t} className={`gate-check ${checks[i] ? 'on' : ''}`}>
                <input type="checkbox" checked={checks[i]} onChange={(e) => setChecks((c) => c.map((v, j) => (j === i ? e.target.checked : v)))} />
                <span><b>{t}</b><small>{d}</small></span>
              </label>
            ))}
            <label className={`gate-check consent ${consent ? 'on' : ''}`}>
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              <span>
                <b>ข้าพเจ้ายินยอมใช้อุปกรณ์ของตนเป็นฟิวส์ตรวจกระแสไฟฟ้า และยอมรับการจัดลำดับชั้นทางพลังงาน</b>
                <small>iLeak เป็นซอฟต์แวร์เสียดสีสำหรับ The Stupid Hackathon Thailand หากนำสายไปจุ่มน้ำจริง อุปกรณ์จะเสียและหมดประกันโดยสมบูรณ์</small>
              </span>
            </label>
            <p className="gate-real">
              <AlertTriangle size={18} /> เรื่องจริงที่ไม่ตลก: ถ้าสงสัยว่าน้ำท่วมมีไฟรั่ว อย่าลงน้ำ อย่าจุ่มอะไรลงไป ตัดไฟที่ต้นทาง แล้วโทร 1129 (กฟภ.) หรือ 1130 (กฟน.)
            </p>
            <button type="button" className="btn-gold wide" disabled={!ready} onClick={onAccept}>
              {ready ? 'ยอมรับข้อตกลงและเข้าสู่ห้องรับรอง' : 'กรุณาทำเครื่องหมายให้ครบทุกข้อ'}
            </button>
          </section>
        )}
      </div>
    </div>
  )
}
