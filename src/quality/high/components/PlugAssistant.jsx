import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import PlugMascot from './PlugMascot.jsx'
import { schemeSound } from '../sound/scheme.js'

const KEY = 'ileak:hide-plug-helper'
const TIPS = {
  welcome: ['ดูเหมือนท่านกำลังยืนอยู่ในน้ำท่วม ต้องการความช่วยเหลือไหม?', '.appraisal'],
  appraised: ['ประเมินอุปกรณ์เสร็จแล้ว! ลองดูว่าท่านมีอุปกรณ์อะไรเสียบได้อีกบ้างไหม?', '.tiles'],
  unplugged: ['ยังไม่มีอุปกรณ์ต่อพ่วงเลย ต้องการให้พาไปดูพอร์ตที่ใช้ได้ไหม?', '.tiles'],
  before: ['พร้อมแล้วใช่ไหม? กดค้างเพื่อจำลองการตรวจ อย่าเอาสายไปจุ่มน้ำจริงนะ!', '.hold'],
}

export default function PlugAssistant({ stamped, connected, covered }) {
  const [hidden, setHidden] = useState(() => {
    try { return sessionStorage.getItem(KEY) === '1' } catch { return false }
  })
  const [open, setOpen] = useState(true)
  const [tip, setTip] = useState('welcome')
  useEffect(() => {
    const show = () => {
      try { sessionStorage.removeItem(KEY) } catch { /* session storage unavailable */ }
      setHidden(false)
      setTip(stamped ? 'appraised' : 'welcome')
      setOpen(true)
    }
    const prepare = () => { if (!hidden) { setTip('before'); setOpen(true) } }
    window.addEventListener('ileak:helper-show', show)
    window.addEventListener('ileak:helper-prepare', prepare)
    return () => {
      window.removeEventListener('ileak:helper-show', show)
      window.removeEventListener('ileak:helper-prepare', prepare)
    }
  }, [hidden, stamped])
  useEffect(() => {
    if (!stamped || hidden) return
    const timer = setTimeout(() => { setTip('appraised'); setOpen(true) }, 5000)
    return () => clearTimeout(timer)
  }, [stamped, hidden])
  useEffect(() => {
    if (!stamped || connected || hidden) return
    const timer = setTimeout(() => { setTip('unplugged'); setOpen(true) }, 14000)
    return () => clearTimeout(timer)
  }, [stamped, connected, hidden])
  useEffect(() => {
    if (open && !hidden && !covered) return schemeSound('notify')
  }, [open, hidden, tip, covered])
  if (hidden || covered) return null
  const help = () => {
    const target = document.querySelector(TIPS[tip][1])
    const motion = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    target?.scrollIntoView({ behavior: motion, block: 'center' })
    target?.querySelector('button, select')?.focus({ preventScroll: true })
    schemeSound('ding')
    setOpen(false)
  }
  return (
    <aside className="plug-assistant" aria-label="น้องปลั๊ก ผู้ช่วย" inert={covered || undefined}>
      {open && <div className="plug-speech" role="status" aria-live="polite">
        <div className="plug-speech-title"><b>น้องปลั๊ก</b><button type="button" onClick={() => setOpen(false)} aria-label="ซ่อนคำแนะนำ"><X size={13} /></button></div>
        <p>{TIPS[tip][0]}</p>
        <div className="plug-actions"><button type="button" onClick={help}>ใช่</button><button type="button" onClick={() => setOpen(false)}>ไม่ต้อง</button></div>
        <button type="button" className="plug-dismiss" onClick={() => { try { sessionStorage.setItem(KEY, '1') } catch { /* session storage unavailable */ } setHidden(true) }}>ไม่ต้องแสดงอีก</button>
      </div>}
      <button type="button" className="plug-character" onClick={() => setOpen(!open)} aria-label={open ? 'ซ่อนน้องปลั๊ก' : 'ขอคำแนะนำจากน้องปลั๊ก'} aria-expanded={open}><PlugMascot /></button>
    </aside>
  )
}
