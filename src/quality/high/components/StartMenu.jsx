import { Droplets, HelpCircle, LogIn, Power, Settings, Sparkles } from 'lucide-react'
import { QUALITIES } from '../../qualityUrl.js'
import { schemeSound } from '../sound/scheme.js'
import PlugMascot from './PlugMascot.jsx'

export default function StartMenu({ quality, onQualityChange, onOpenQualityGate, onClose, onRestart }) {
  const select = (action) => {
    onClose()
    action()
  }
  return (
    <section id="xp-start-menu" className="start-menu" aria-label="เมนู Start">
      <header className="start-user"><span><PlugMascot /></span><div><b>ผู้ใช้สายชาร์จ</b><small>iLeak: HydroCharging</small></div></header>
      <div className="start-columns">
        <div className="start-apps">
          <button type="button" onClick={() => select(() => document.querySelector('.appraisal')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))}>
            <Droplets size={29} /><span><b>iLeak: HydroCharging</b><small>ตรวจไฟรั่วในน้ำท่วม</small></span>
          </button>
          <button type="button" onClick={() => select(() => window.dispatchEvent(new CustomEvent('ileak:helper-show')))}>
            <HelpCircle size={29} /><span><b>น้องปลั๊ก</b><small>ผู้ช่วยประจำเครื่อง</small></span>
          </button>
          <button type="button" onClick={() => select(() => { schemeSound('ding'); alert('เซิร์ฟเวอร์จมน้ำอยู่ ไม่สามารถเข้าสู่ระบบได้') })}>
            <LogIn size={29} /><span><b>เข้าสู่ระบบ</b><small>บัญชีผู้ใช้งาน</small></span>
          </button>
        </div>
        <div className="start-settings">
          <label className="start-quality" htmlFor="start-quality"><Settings size={22} /><b>ระดับกราฟิก</b></label>
          <select id="start-quality" value={quality} onChange={(e) => select(() => onQualityChange?.(e.target.value))}>
            {QUALITIES.map((item) => <option key={item} value={item}>{item.toUpperCase()}</option>)}
          </select>
          <button type="button" onClick={() => select(() => onOpenQualityGate?.())}><Sparkles size={22} /><span>เปิดหน้าตั้งค่ากราฟิก</span></button>
          <p>เสียบสายให้ครบ<br />แล้วโลกจะสดใสขึ้น</p>
        </div>
      </div>
      <footer><span>พร้อมใช้งาน</span><button type="button" onClick={() => select(onRestart)}><Power size={20} /> ปิดเครื่อง…</button></footer>
    </section>
  )
}
