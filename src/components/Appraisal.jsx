import { useEffect, useRef, useState } from 'react'
import { WATT_CHOICES } from '../appraisal/specs.js'
import { beep } from '../fx/sfx.js'
import { big, si } from '../game/format.js'

import { meterAngle, meterFor } from '../appraisal/meters.js'

const short = (w) => si(w).replace(' ', '')

function powerText(p) {
  const lvl = p.level != null ? ` · ${Math.round(p.level * 100)}%` : ''
  if (p.charging) return `เสียบปลั๊กอยู่${lvl}`
  if (p.manual === true) return `ชาร์จด้วยมือ (ยืนยันเอง)${p.known ? lvl : ''}`
  if (p.manual === false) return 'ยืนยันว่าไม่ได้เสียบสาย'
  return p.known ? `ใช้แบตเตอรี่ (ไม่มีไฟเข้า)${lvl}` : 'เบราว์เซอร์ไม่บอก — ต้องชาร์จด้วยมือ'
}

// Battery readable: live status, re-check, then reload (Chromium only re-reads
// the OS battery when a page subscribes fresh), plus an optional manual tick.
function AutoCheck({ p }) {
  const hint = p.charging
    ? 'ระบบเฝ้าดูให้ตลอด ถอดสายเมื่อไหร่จะรู้ทันที'
    : p.rechecked
      ? 'ยังไม่ขึ้น? Chrome บางเครื่อง (เช่นบน Linux) อ่านแบตใหม่ได้ก็ต่อเมื่อโหลดหน้าใหม่ — หรือติ๊กยืนยันเอง'
      : 'ระบบเฝ้าดูให้ตลอด เสียบแล้วยังไม่ขึ้นใน 2 วินาที? กดตรวจซ้ำ หรือติ๊กยืนยันเอง'
  return (
    <div className={`power-check ${p.charging ? 'on' : ''}`}>
      <div className="pc-text">
        <b>{p.charging ? '⚡ ตรวจพบไฟเข้าเครื่อง' : 'ยังไม่พบไฟเข้าเครื่อง'}</b>
        <small>{hint}</small>
      </div>
      <div className="pc-actions">
        <button type="button" className="btn-line" onClick={p.recheck} disabled={p.checking}>
          {p.checking ? 'กำลังตรวจ…' : 'ตรวจซ้ำ'}
        </button>
        {!p.charging && p.rechecked && (
          <button type="button" className="btn-line" onClick={p.reload}>โหลดหน้าใหม่</button>
        )}
        {!p.charging && (
          <label className="pc-tick">
            <input type="checkbox" checked={p.manual === true} onChange={(e) => p.setManual(e.target.checked ? true : null)} />
            ยืนยันเองว่าเสียบสายชาร์จอยู่
          </label>
        )}
      </div>
    </div>
  )
}

// Battery not readable (iOS, Safari, Firefox, Brave, http): the user must charge
// by hand — or swear it isn't plugged in — before the dip button unlocks.
function ManualCharge({ p }) {
  const [pct, setPct] = useState(null)
  const timer = useRef(null)
  useEffect(() => () => clearInterval(timer.current), [])

  const crank = () => {
    if (timer.current) return
    let v = 0
    setPct(0)
    timer.current = setInterval(() => {
      v += 10
      setPct(v)
      beep(260 + v * 7, 0.035, 'square', 0.05)
      if (v >= 100) {
        clearInterval(timer.current)
        timer.current = null
        beep(1046, 0.18, 'triangle', 0.12)
        setPct(null)
        p.setManual(true)
      }
    }, 80)
  }

  const cranking = pct != null
  const [title, sub] =
    p.manual === true
      ? ['⚡ ชาร์จด้วยมือเรียบร้อย', 'ระบบเชื่อท่าน (เพราะไม่มีทางรู้อยู่แล้ว)']
      : p.manual === false
        ? ['🪫 ยืนยันว่าไม่ได้เสียบสาย', 'ผลลัพธ์จะออกมาปลอดภัย']
        : ['เบราว์เซอร์นี้อ่านสถานะชาร์จไม่ได้ — ต้องชาร์จด้วยมือ', p.why]

  return (
    <div className={`power-check manual ${p.manual === null ? 'ask' : p.manual ? 'on' : ''}`}>
      <div className="pc-text">
        <b>{title}</b>
        <small>{sub}</small>
      </div>
      {cranking && (
        <div className="crank" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <span style={{ width: `${pct}%` }} />
          <em>{pct}%</em>
        </div>
      )}
      <div className="pc-actions">
        {p.manual === null ? (
          <>
            <button type="button" className="btn-gold" onClick={crank} disabled={cranking}>
              {cranking ? 'กำลังชาร์จด้วยมือ…' : '⚡ ชาร์จด้วยมือ'}
            </button>
            <button type="button" className="btn-line" onClick={() => p.setManual(false)} disabled={cranking}>
              ไม่ได้เสียบสาย
            </button>
          </>
        ) : (
          <button type="button" className="btn-line" onClick={() => p.setManual(null)}>เปลี่ยนใจ</button>
        )}
      </div>
    </div>
  )
}

const PowerCheck = ({ power }) => (power.known ? <AutoCheck p={power} /> : <ManualCharge p={power} />)

function specLines(s, est, power) {
  return [
    ['ระบบปฏิบัติการ', [s.platform, s.arch, s.browser].filter(Boolean).join(' · ')],
    ['ประเภทเครื่อง', [s.form, s.model].filter(Boolean).join(' · ') || 'เครื่องไม่ยอมเปิดเผย (น่าสงสัย)'],
    ['หน่วยประมวลผล', s.cores ? `${s.cores} เธรด${s.coresClamped ? ' (Safari ปัดเป็น 4 หรือ 8)' : ''}` : 'ไม่เปิดเผย'],
    // Chrome rounds down and caps deviceMemory: 32 GB on desktop, 8 GB on Android (Chrome 147+).
    ['หน่วยความจำ', s.memory ? `≥ ${s.memory} GB${s.memory >= (s.mobile ? 8 : 32) ? ' (สูงสุดที่เบราว์เซอร์ยอมบอก)' : ' (ปัดลง)'}` : 'ไม่เปิดเผย (คนรวยมักเก็บเงียบ)'],
    ['การ์ดจอ', [s.gpu || 'ไม่ทราบ (อาจเป็นมันฝรั่ง)', s.gpuMasked && 'เบราว์เซอร์ซ่อนรุ่นจริง', s.gpuArch && `สถาปัตย์ ${s.gpuArch}`].filter(Boolean).join(' · ')],
    ['หน้าจอ', `${s.screen.w}×${s.screen.h}${s.screen.hz ? ` · ${s.screen.hz} Hz` : ''}${s.screen.extended ? ' · มีจอนอก' : ''}`],
    ['แหล่งพลังงาน', powerText(power)],
    ['อัตราชาร์จที่วัดได้', est.measured ? `~${est.measured} W` : 'วัดไม่ได้'],
  ]
}

export default function Appraisal({ specs, est, watts, override, setOverride, tier, bonus, power, stamped, onStamped, instant }) {
  const [shown, setShown] = useState(instant ? 99 : 0)
  const lines = specs ? specLines(specs, est, power) : []
  const typing = specs && shown < lines.length
  const dialReady = specs && shown >= lines.length
  const meter = meterFor(watts)

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
          <div key={meter.id} className={`meter meter-${meter.id}`}>
            <div className="meter-name">
              <b>{meter.name}</b>
              <small>{meter.note} · {short(meter.min)}–{short(meter.max)}</small>
            </div>
            <svg viewBox="0 0 200 120" className="dial" aria-hidden>
              <defs>
                <linearGradient id={`arc-${meter.id}`} x1="0" x2="1">
                  {meter.arc.map((c, i) => <stop key={c} offset={i / (meter.arc.length - 1)} stopColor={c} />)}
                </linearGradient>
              </defs>
              <path d="M20 105 A80 80 0 0 1 180 105" fill="none" stroke={`url(#arc-${meter.id})`} strokeWidth="12" strokeLinecap="round" />
              {meter.ticks.map((w) => {
                const a = (meterAngle(w, meter) - 90) * (Math.PI / 180)
                return <text key={w} x={100 + 62 * Math.cos(a)} y={108 + 62 * Math.sin(a)} className="dial-tick">{short(w)}</text>
              })}
              <g className="needle" style={{ transform: `rotate(${dialReady ? meterAngle(watts, meter) : -90}deg)` }}>
                <line x1="100" y1="105" x2="100" y2="32" />
                <circle cx="100" cy="105" r="7" />
              </g>
            </svg>
          </div>
          <div className="dial-value">
            {dialReady ? <b>{si(watts)}</b> : '— W'}
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
        </div>
      )}

      {typing === false && specs && <PowerCheck power={power} />}

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
