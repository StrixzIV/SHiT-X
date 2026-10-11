import { useEffect, useId, useRef, useState } from 'react'
import { AlertTriangle, Check, ShieldAlert, X } from 'lucide-react'
import BrandLogo from '../../components/BrandLogo.jsx'
import { schemeSound } from '../sound/scheme.js'
import { createReadFirstPicker } from './agreementMessages.js'

// Each warning mounts separately so its reading timer and sound start afresh.
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

function WarningIcon() {
  const id = useId()
  return (
    <svg className="xp-warning" viewBox="0 0 40 40" aria-hidden="true">
      <defs><linearGradient id={id} x2="0" y2="1"><stop stopColor="#fff8b0" /><stop offset=".45" stopColor="#ffe150" /><stop offset="1" stopColor="#e6ac17" /></linearGradient></defs>
      <path d="M18 4a2 2 0 0 1 4 0l16 29a2 2 0 0 1-2 3H4a2 2 0 0 1-2-3Z" transform="translate(1 2)" fill="#000" opacity=".2" />
      <path d="M18 4a2 2 0 0 1 4 0l16 29a2 2 0 0 1-2 3H4a2 2 0 0 1-2-3Z" fill={`url(#${id})`} stroke="#8b753c" strokeWidth="1.2" />
      <path d="M18 12h4l-.6 13h-2.8Z" fill="#171717" /><circle cx="20" cy="30" r="2.1" fill="#171717" />
    </svg>
  )
}

function ReadFirstError({ message, onDismiss }) {
  const id = useId()
  const ok = useRef(null)
  useEffect(() => {
    ok.current?.focus()
    return schemeSound('critical')
  }, [])
  return (
    <div className="gate-error-layer">
      <section className="gate-sheet xp-dialog gate-warning gate-error" role="alertdialog" aria-modal="true" aria-labelledby="gate-error-title" aria-describedby="gate-error-message" onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault()
          event.stopPropagation()
          onDismiss()
        }
      }}>
        <div className="xp-titlebar">
          <h2 id="gate-error-title">iLeak.exe — READ FIRST</h2>
          <button type="button" className="xp-close" aria-label="ปิดข้อความผิดพลาด" onClick={onDismiss}><X size={14} /></button>
        </div>
        <div className="gate-warning-body">
          <svg className="xp-error-icon" viewBox="0 0 40 40" aria-hidden="true">
            <defs><radialGradient id={id} cx=".3" cy=".2" r=".8"><stop stopColor="#ffb7a7" /><stop offset=".4" stopColor="#f33723" /><stop offset="1" stopColor="#a30906" /></radialGradient></defs>
            <circle cx="21" cy="22" r="17" fill="#000" opacity=".2" /><circle cx="20" cy="20" r="17" fill={`url(#${id})`} stroke="#a71309" />
            <path d="m13 13 14 14m0-14L13 27" stroke="#fff" strokeWidth="4" />
          </svg>
          <div id="gate-error-message"><h3>อ่านก่อน!</h3><p>{message}</p></div>
        </div>
        <footer className="gate-warning-footer"><button ref={ok} type="button" className="gate-ok" onClick={onDismiss}>OK</button></footer>
      </section>
    </div>
  )
}

function GateWindow({ title, className, kind = 'dialog', pickMessage, children }) {
  const [closeError, setCloseError] = useState(null)
  const ref = useRef(null)
  const returnFocus = useRef(null)
  useEffect(() => {
    ref.current?.focus()
  }, [])
  const remind = () => {
    if (closeError) return
    returnFocus.current = document.activeElement
    setCloseError(pickMessage())
  }
  const dismiss = () => {
    setCloseError(null)
    requestAnimationFrame(() => {
      const target = returnFocus.current
      if (ref.current?.contains(target) && !target.disabled) target.focus()
      else ref.current?.focus()
    })
  }
  return (
    <>
      <section ref={ref} tabIndex={-1} className={`gate-sheet xp-dialog ${className}`} role={kind} inert={closeError ? true : undefined} aria-hidden={closeError ? true : undefined} aria-modal={closeError ? undefined : true} aria-labelledby="gate-title" aria-describedby={kind === 'alertdialog' ? 'gate-message' : undefined} onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault()
          remind()
        }
      }}>
        <div className="xp-titlebar">
          <h2 id="gate-title">{title}</h2>
          <button type="button" className="xp-close" aria-label="ปิดคำเตือน" onClick={remind}><X size={14} /></button>
        </div>
        {children}
      </section>
      {closeError && <ReadFirstError message={closeError} onDismiss={dismiss} />}
    </>
  )
}

function WarningDialog({ index, onNext, onSkip, pickMessage }) {
  const [title, body] = FACTS[index]
  const [left, setLeft] = useState(() => readSeconds(body))
  const ok = useRef(null)
  useEffect(() => schemeSound('exclamation'), [])
  useEffect(() => {
    const t = setInterval(() => setLeft((n) => (n > 0 ? n - 1 : 0)), 1000)
    return () => clearInterval(t)
  }, [])
  useEffect(() => {
    if (left === 0 && ok.current?.closest('.gate-warning').contains(document.activeElement)) ok.current.focus()
  }, [left])
  return (
    <GateWindow title="iLeak: HydroCharging" className="gate-warning" kind="alertdialog" pickMessage={pickMessage}>
      <div className="gate-warning-body">
        <WarningIcon />
        <div id="gate-message"><h3>{title}</h3><p>{body}</p></div>
      </div>
      <footer className="gate-warning-footer">
        <div className="gate-warning-status"><span>คำเตือน {index + 1} / {FACTS.length}</span><span id="gate-cooldown" role="status">{left > 0 ? `กด OK ได้ใน ${left} วินาที` : 'พร้อมแล้ว · 0 วินาที'}</span></div>
        <button ref={ok} type="button" className="gate-ok" disabled={left > 0} aria-describedby="gate-cooldown" onClick={() => { if (left === 0) onNext() }}>OK</button>
        {onSkip && <button type="button" className="gate-dev-skip" onClick={onSkip}>ข้าม (dev)</button>}
      </footer>
    </GateWindow>
  )
}

function ConsentDialog({ onAccept, dev, pickMessage }) {
  const [checks, setChecks] = useState(() => CHECKS.map(() => false))
  const [consent, setConsent] = useState(false)
  useEffect(() => schemeSound('ding'), [])
  const ready = checks.every(Boolean) && consent
  return (
    <GateWindow title="iLeak: HydroCharging · ข้อตกลงก่อนใช้บริการ" className="gate-final" pickMessage={pickMessage}>
      <div className="gate-content">
        <header className="gate-consent-head">
          <span className="gate-app-icon"><BrandLogo decorative /></span>
          <div><span className="eyebrow">ข้อตกลงก่อนใช้บริการ</span><h1>iLeak: HydroCharging</h1><p><Check size={15} /> อ่านคำเตือนครบทั้ง {FACTS.length} ข้อแล้ว</p></div>
        </header>
        <fieldset className="gate-safety">
          <legend><ShieldAlert size={18} /> มาตรการความปลอดภัย</legend>
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
        </fieldset>
        <p className="gate-real">
          <AlertTriangle size={18} /> เรื่องจริงที่ไม่ตลก: ถ้าสงสัยว่าน้ำท่วมมีไฟรั่ว อย่าลงน้ำ อย่าจุ่มอะไรลงไป ตัดไฟที่ต้นทาง แล้วโทร 1129 (กฟภ.) หรือ 1130 (กฟน.)
        </p>
      </div>
      <footer className="gate-consent-footer">
        <p id="gate-consent-status" role="status">{ready ? 'พร้อมเข้าสู่ห้องรับรอง' : 'กรุณาทำเครื่องหมายให้ครบทุกข้อ'}</p>
        <button type="button" className="gate-ok gate-accept" disabled={!ready} aria-describedby="gate-consent-status" onClick={() => { if (ready) onAccept() }}>
          <b>OK</b><span>ยอมรับข้อตกลงและเข้าสู่ห้องรับรอง</span>
        </button>
        {dev && <button type="button" className="gate-dev-skip" onClick={onAccept}>ข้าม (dev)</button>}
      </footer>
    </GateWindow>
  )
}

export default function AgreementGate({ onAccept, dev }) {
  const [read, setRead] = useState(0)
  const [pickMessage] = useState(createReadFirstPicker)
  return (
    <div className="gate gate-sequence">
      {read < FACTS.length ? (
        <WarningDialog key={read} index={read} pickMessage={pickMessage} onSkip={dev ? onAccept : undefined} onNext={() => {
          setRead((current) => current === read ? current + 1 : current)
        }} />
      ) : (
        <ConsentDialog onAccept={onAccept} dev={dev} pickMessage={pickMessage} />
      )}
    </div>
  )
}
