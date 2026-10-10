import { useEffect, useState } from 'react'
import { WATT_CHOICES } from '../appraisal/specs.js'
import { beep } from '../fx/sfx.js'
import { big, si } from '../game/format.js'

const LOG_MIN = Math.log(5)
const LOG_MAX = Math.log(1000)
const needleAngle = (w) => -90 + 180 * Math.min(1, Math.max(0, (Math.log(Math.max(w, 5)) - LOG_MIN) / (LOG_MAX - LOG_MIN)))

function specLines(s, est, powered, userPlugged) {
  const b = s.battery
  return [
    ['ระบบปฏิบัติการ', [s.platform, s.arch].filter(Boolean).join(' · ')],
    ['รุ่นเครื่อง', s.model || 'เครื่องไม่ยอมเปิดเผย (น่าสงสัย)'],
    ['หน่วยประมวลผล', s.cores ? `${s.cores} เธรด` : 'ไม่เปิดเผย'],
    ['หน่วยความจำ', s.memory ? `≥ ${s.memory} GB` : 'ไม่เปิดเผย (คนรวยมักเก็บเงียบ)'],
    ['การ์ดจอ', s.gpu || 'ไม่ทราบ (อาจเป็นมันฝรั่ง)'],
    ['หน้าจอ', `${s.screen.w}×${s.screen.h} @${s.screen.dpr}x`],
    ['แหล่งพลังงาน', b ? `${powered ? 'เสียบปลั๊กอยู่' : 'ใช้แบตเตอรี่ (ไม่มีไฟเข้า)'} · ${Math.round(b.level * 100)}%` : userPlugged ? 'แจ้งว่าเสียบปลั๊ก' : 'ไม่ทราบ'],
    ['อัตราชาร์จที่วัดได้', est.measured ? `~${est.measured} W` : 'วัดไม่ได้'],
  ]
}

export default function Appraisal({ specs, est, watts, override, setOverride, tier, bonus, powered, batteryKnown, userPlugged, setUserPlugged, stamped, onStamped, instant }) {
  const [shown, setShown] = useState(instant ? 99 : 0)
  const lines = specs ? specLines(specs, est, powered, userPlugged) : []
  const typing = specs && shown < lines.length
  const dialReady = specs && shown >= lines.length

  useEffect(() => {
    if (!specs || instant) return
    const t = setInterval(() => {
      setShown((n) => {
        if (n < 8) beep(1200 + n * 60, 0.03, 'square', 0.04)
        return n + 1
      })
    }, 420)
    return () => clearInterval(t)
  }, [specs, instant])

  useEffect(() => {
    if (!dialReady || stamped) return
    const t = setTimeout(() => {
      beep(90, 0.35, 'square', 0.25, 40)
      if (tier.mult >= 8) setTimeout(() => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, 0.25, 'triangle', 0.12), i * 110)), 200)
      onStamped()
    }, instant ? 0 : 1600)
    return () => clearTimeout(t)
  }, [dialReady, stamped, tier.mult, onStamped, instant])

  return (
    <section className="panel appraisal">
      <div className="panel-head">
        <span className="eyebrow">ขั้นที่ 1 · การประเมินฐานะอุปกรณ์</span>
        <h2>เรากำลังตัดสินอุปกรณ์ของท่าน</h2>
      </div>

      <div className="appraisal-grid">
        <dl className="spec-list">
          {!specs && <div className="spec-row"><dt>กำลังเชื่อมต่อฐานข้อมูลชนชั้น</dt><dd className="dots" /></div>}
          {lines.slice(0, shown + 1).map(([k, v], i) => (
            <div className="spec-row" key={k}>
              <dt>{k}</dt>
              <dd className={i === shown ? 'dots' : 'typed'}>{i === shown ? '' : v}</dd>
            </div>
          ))}
        </dl>

        <div className={`dial-wrap ${dialReady ? 'on' : ''}`}>
          <svg viewBox="0 0 200 120" className="dial" aria-hidden>
            <defs>
              <linearGradient id="arc" x1="0" x2="1">
                <stop offset="0" stopColor="#6b6b6b" />
                <stop offset=".55" stopColor="#c9a227" />
                <stop offset="1" stopColor="#ff4d2e" />
              </linearGradient>
            </defs>
            <path d="M20 105 A80 80 0 0 1 180 105" fill="none" stroke="url(#arc)" strokeWidth="12" strokeLinecap="round" />
            {[5, 20, 65, 280, 1000].map((w) => {
              const a = (needleAngle(w) - 90) * (Math.PI / 180)
              return <text key={w} x={100 + 62 * Math.cos(a)} y={108 + 62 * Math.sin(a)} className="dial-tick">{w}</text>
            })}
            <g
              className={`needle ${dialReady && watts > 1000 ? 'overload' : ''}`}
              style={{ transform: `rotate(${dialReady ? needleAngle(watts) : -90}deg)`, '--spin': `${Math.max(0.06, 0.9 - Math.log10(watts) / 25)}s` }}
            >
              <line x1="100" y1="105" x2="100" y2="32" />
              <circle cx="100" cy="105" r="7" />
            </g>
          </svg>
          <div className="dial-value">
            {dialReady ? <b>{si(watts)}</b> : '— W'}
            {dialReady && watts > 1000 && <small className="overload-note">เข็มหลุด! เกินสเกลมาตรวัด</small>}
            <small>{override ? 'แจ้งเอง (ไม่ผ่านการรับรอง)' : est.why}</small>
          </div>
        </div>
      </div>

      {typing === false && specs && (
        <div className="appraisal-tools">
          <label>
            ระบบประเมินผิด? แจ้งวัตต์หัวชาร์จของท่าน
            <select value={override ?? ''} onChange={(e) => setOverride(e.target.value ? Number(e.target.value) : null)}>
              <option value="">เชื่อระบบ ({si(est.watts)})</option>
              {WATT_CHOICES.map((w) => <option key={w} value={w}>{si(w)}</option>)}
            </select>
          </label>
          {!batteryKnown && (
            <label className="toggle">
              <input type="checkbox" checked={userPlugged} onChange={(e) => setUserPlugged(e.target.checked)} />
              เครื่องเสียบสายชาร์จอยู่ (เบราว์เซอร์นี้ไม่ยอมบอก)
            </label>
          )}
        </div>
      )}

      {stamped && (
        <div key={tier.id} className={`tier-card tier-${tier.cls}`}>
          <div className="tier-letter">{tier.id}</div>
          <div className="tier-info">
            <span className="eyebrow">ระดับชั้นของท่าน</span>
            <h3>{tier.title}</h3>
            <p>{tier.remark}</p>
            <div className="tier-score">
              <span>ค่าพลัง <b>{big(watts + bonus)}</b> <small>({si(watts)} + สเปก {bonus})</small></span>
              <span className="m1">mult<sub>1</sub> ×{tier.mult}</span>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
