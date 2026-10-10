import { useState } from 'react'
import { TIERS } from '../../../appraisal/specs.js'
import { big, si } from '../../../game/format.js'
import { DEFAULT_KNOBS, DEFAULT_SKIPS } from '../devDefaults.js'

// Opened from the DEV tickbox (top right). Works on every screen; the FX and
// stress buttons need the main page, so they're disabled until it's showing.

const SKIPS = [
  ['gate', 'ข้ามหน้าข้อตกลง'],
  ['ios', 'ข้ามหน้าบล็อก iOS'],
  ['appraisal', 'ข้ามแอนิเมชันประเมิน'],
  ['manual', 'ข้ามการบังคับชาร์จด้วยมือ'],
  ['calc', 'ข้ามการคำนวณ (ไปผลลัพธ์เลย)'],
  ['hold', 'ปุ่มกดค้างแค่ 0.3 วิ'],
]

export default function DevPanel({ skips, setSkips, knobs, setKnobs, info, main, onRandomWatts, onMaxChaos, onStop, onShowGate, onClose }) {
  const [text, setText] = useState('')
  const set = (k, v) => setKnobs((o) => ({ ...o, [k]: v }))
  const onMain = !!info
  const apply = () => {
    const n = Number(text)
    if (text.trim() !== '' && Number.isFinite(n) && n >= 0) set('watts', n)
  }

  return (
    <aside className="dev" aria-label="Dev panel">
      <div className="dev-head">
        <b>DEV</b>
        <span>
          {onMain
            ? `${si(info.watts)} · ${info.tier} · ${big(info.chips)}×${info.mult1}×${info.mult2} = ${big(info.total)} (L${info.level})`
            : 'ยังไม่อยู่หน้าหลัก'}
        </span>
        <button type="button" onClick={onClose} aria-label="ซ่อนแผง">—</button>
      </div>

      <section>
        <h4>ข้าม</h4>
        <div className="dev-grid">
          {SKIPS.map(([k, label]) => (
            <label key={k} className="dev-check">
              <input type="checkbox" checked={skips[k]} onChange={(e) => setSkips((s) => ({ ...s, [k]: e.target.checked }))} />
              {label}
            </label>
          ))}
        </div>
      </section>

      <section>
        <h4>ค่า</h4>
        <label className="dev-row">
          <span>วัตต์</span>
          <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && apply()} placeholder="280, 1.21e9, 1e42" inputMode="decimal" />
          <button type="button" onClick={apply}>ตั้ง</button>
          <button type="button" onClick={() => { set('watts', null); setText('') }}>auto</button>
        </label>
        <div className="dev-row wrap">
          <span>tier</span>
          {[...TIERS].reverse().map((t) => (
            <button key={t.id} type="button" className={info?.tier === t.id ? 'on' : ''} onClick={() => set('watts', Math.max(t.min, 5))}>{t.id}</button>
          ))}
        </div>
        <div className="dev-row">
          <span>ไฟเข้า</span>
          {['auto', 'on', 'off'].map((p) => <button key={p} type="button" className={knobs.power === p ? 'on' : ''} onClick={() => set('power', p)}>{p}</button>)}
        </div>
        <div className="dev-row">
          <span>USB-C ปลอม</span>
          <button type="button" onClick={() => set('fake', Math.max(0, knobs.fake - 1))}>−</button>
          <b>{knobs.fake}</b>
          <button type="button" onClick={() => set('fake', knobs.fake + 1)}>+</button>
          <span>speed</span>
          {[1, 3, 10].map((x) => <button key={x} type="button" className={knobs.speed === x ? 'on' : ''} onClick={() => set('speed', x)}>{x}×</button>)}
        </div>
      </section>

      <section>
        <h4>ยิง FX {!onMain && <small>(ต้องอยู่หน้าหลัก)</small>}</h4>
        <div className="dev-row wrap">
          <button type="button" className="go" disabled={!onMain} onClick={() => main.current?.fire(null)}>คะแนนจริง</button>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((l) => <button key={l} type="button" disabled={!onMain} onClick={() => main.current?.fire(l)}>L{l}</button>)}
        </div>
      </section>

      <section>
        <h4>Stress test</h4>
        <div className="dev-row wrap">
          <button type="button" disabled={!onMain} onClick={() => main.current?.sequence([0, 1, 2, 3, 4, 5, 6, 7])}>วนทุกระดับ L0→L7</button>
          <button type="button" disabled={!onMain} onClick={() => main.current?.sequence(['real', 'real', 'real', 'real', 'real'])}>ยิงคะแนนจริง ×5</button>
          <button type="button" onClick={onRandomWatts}>สุ่มวัตต์ 10 วิ</button>
          <button type="button" onClick={() => set('fake', 50)}>USB-C ปลอม ×50</button>
          <button type="button" className="go" disabled={!onMain} onClick={onMaxChaos}>โกลาหลสูงสุด</button>
          <button type="button" className="stop" onClick={onStop}>หยุด</button>
        </div>
        <label className="dev-check">
          <input type="checkbox" checked={knobs.fps} onChange={(e) => set('fps', e.target.checked)} />
          แสดง FPS (ดูว่าเครื่องไหวไหม)
        </label>
      </section>

      <section className="dev-row wrap">
        <button type="button" disabled={!onMain} onClick={() => main.current?.replay()}>เล่นการประเมินใหม่</button>
        <button type="button" onClick={onShowGate}>เปิดข้อตกลง</button>
        <button type="button" onClick={() => { setSkips(DEFAULT_SKIPS); setKnobs(DEFAULT_KNOBS); setText('') }}>รีเซ็ต</button>
      </section>

      {info?.specs && (
        <details>
          <summary>raw spec (ที่เบราว์เซอร์บอกจริง)</summary>
          <pre>{JSON.stringify({ estimate: info.est, ...info.specs }, null, 1)}</pre>
        </details>
      )}
    </aside>
  )
}
