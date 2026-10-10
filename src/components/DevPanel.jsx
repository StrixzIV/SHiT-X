import { useState } from 'react'
import { TIERS } from '../appraisal/specs.js'
import { big, si } from '../game/format.js'

// ?dev — skip the ceremony and poke every knob.
export default function DevPanel({ watts, setWatts, power, setPower, fake, setFake, speed, setSpeed, score, tier, onFire, onReplay, onShowGate }) {
  const [open, setOpen] = useState(true)
  const [text, setText] = useState('')
  const apply = () => {
    const n = Number(text)
    if (Number.isFinite(n) && n >= 0) setWatts(n)
  }

  if (!open) return <button type="button" className="dev-pill" onClick={() => setOpen(true)}>DEV</button>

  return (
    <aside className="dev">
      <header>
        <b>DEV</b>
        <span>{si(watts)} · {tier.id} · {big(score.chips)}×{score.mult1}×{score.mult2} = {big(score.total)} (L{score.level})</span>
        <button type="button" onClick={() => setOpen(false)} aria-label="ย่อ">—</button>
      </header>

      <label className="dev-row">
        <span>วัตต์</span>
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && apply()} placeholder="280, 1.21e9, 1e42" inputMode="decimal" />
        <button type="button" onClick={apply}>ตั้ง</button>
        <button type="button" onClick={() => { setWatts(null); setText('') }}>auto</button>
      </label>

      <div className="dev-row wrap">
        <span>tier</span>
        {[...TIERS].reverse().map((t) => (
          <button key={t.id} type="button" className={t.id === tier.id ? 'on' : ''} onClick={() => setWatts(Math.max(t.min, 5))}>{t.id}</button>
        ))}
      </div>

      <div className="dev-row">
        <span>ไฟเข้า</span>
        {['auto', 'on', 'off'].map((p) => <button key={p} type="button" className={power === p ? 'on' : ''} onClick={() => setPower(p)}>{p}</button>)}
      </div>

      <div className="dev-row">
        <span>USB-C ปลอม</span>
        <button type="button" onClick={() => setFake(Math.max(0, fake - 1))}>−</button>
        <b>{fake}</b>
        <button type="button" onClick={() => setFake(fake + 1)}>+</button>
        <span>speed</span>
        {[1, 3, 10].map((x) => <button key={x} type="button" className={speed === x ? 'on' : ''} onClick={() => setSpeed(x)}>{x}×</button>)}
      </div>

      <div className="dev-row wrap">
        <span>ยิง FX</span>
        <button type="button" className="go" onClick={() => onFire(null)}>คะแนนจริง</button>
        {[0, 1, 2, 3, 4, 5, 6, 7].map((l) => <button key={l} type="button" onClick={() => onFire(l)}>L{l}</button>)}
      </div>

      <div className="dev-row">
        <button type="button" onClick={onReplay}>เล่นการประเมินใหม่</button>
        <button type="button" onClick={onShowGate}>เปิดข้อตกลง</button>
      </div>
    </aside>
  )
}
