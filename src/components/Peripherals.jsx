import { BatteryCharging, Cable, Cpu, EthernetPort, Gamepad2, Headphones, Keyboard, Monitor, Mouse, Pill, Smartphone, Usb } from 'lucide-react'
import { peripheralWeight } from '../game/score.js'
import { CountUp } from '../fx/juice.jsx'

const ICONS = {
  serial: Cable, battery: BatteryCharging, webusb: Usb, audio: Headphones, display: Monitor,
  webhid: Keyboard, gamepad: Gamepad2, otg: Mouse, ethernet: EthernetPort, native: Smartphone, placebo: Pill,
}

export default function Peripherals({ items, tap, mult2 }) {
  return (
    <section className="panel">
      <div className="panel-head row">
        <div>
          <span className="eyebrow">ขั้นที่ 2 · ยกระดับด้วยอุปกรณ์ต่อพ่วง</span>
          <h2>ยิ่งเสียบมาก ยิ่งมีหน้ามีตา</h2>
          <p className="muted">แตะเพื่อเชื่อมต่อ · USB-C นับสองเท่า · อุปกรณ์ที่เครื่องท่านไม่รองรับจะถูกตัดสิทธิ์</p>
        </div>
        <div className="m2-badge">
          <span>mult<sub>2</sub></span>
          <b>X<CountUp value={mult2 * 10} ms={300} format={(v) => (v / 10).toString()} /></b>
        </div>
      </div>
      <div className="tiles">
        {items.map((p) => {
          const Icon = ICONS[p.id] ?? Cpu
          const state = !p.supported ? 'off' : p.live ? 'live' : p.armed ? 'idle' : 'locked'
          return (
            <button key={p.id} type="button" className={`tile ${state}`} onClick={() => tap(p.id)} disabled={!p.supported} title={p.detail}>
              <span className="tile-top">
                <Icon size={22} />
                <span className="tile-port">{p.port}</span>
              </span>
              <b>{p.name}</b>
              <small>{p.label}</small>
              <span className="tile-detail">{state === 'locked' ? p.hint ?? 'แตะเพื่อเชื่อมต่อ' : p.detail}</span>
              <span className="tile-weight">{p.supported ? <>+{peripheralWeight(p)} mult<sub>2</sub></> : 'ตัดสิทธิ์'}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
