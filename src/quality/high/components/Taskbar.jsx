import { useEffect, useRef, useState } from 'react'
import { Power, Volume2, VolumeX, X } from 'lucide-react'
import BrandLogo from '../../components/BrandLogo.jsx'
import StartMenu from './StartMenu.jsx'
import HardwareBalloon from './HardwareBalloon.jsx'
import { schemeSound } from '../sound/scheme.js'

export default function Taskbar({ sound, onSound, quality = 'high', onQualityChange, onOpenQualityGate, cards, active, covered }) {
  const [open, setOpen] = useState(false)
  const [now, setNow] = useState(() => new Date())
  const [restart, setRestart] = useState(false)
  const [restarting, setRestarting] = useState(false)
  const ref = useRef(null)
  const start = useRef(null)
  const timer = useRef(null)
  useEffect(() => {
    const clock = setInterval(() => setNow(new Date()), 15000)
    return () => {
      clearInterval(clock)
      clearTimeout(timer.current)
    }
  }, [])
  useEffect(() => {
    if (!open && !restart) return
    const outside = (event) => {
      if (open && !ref.current?.contains(event.target)) setOpen(false)
    }
    const escape = (event) => {
      if (event.key !== 'Escape' || restarting) return
      setOpen(false)
      setRestart(false)
      start.current?.focus()
    }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('keydown', escape)
    }
  }, [open, restart, restarting])
  const toggle = () => {
    if (!open) schemeSound('start')
    setOpen(!open)
  }
  return (
    <div ref={ref} className="taskbar" aria-label="แถบงาน" inert={covered || undefined} aria-hidden={covered || undefined}>
      {open && <StartMenu quality={quality} onQualityChange={onQualityChange} onOpenQualityGate={onOpenQualityGate} onClose={() => setOpen(false)} onRestart={() => setRestart(true)} />}
      <button ref={start} type="button" className={`start-button${open ? ' on' : ''}`} onClick={toggle} disabled={covered} aria-expanded={open} aria-controls="xp-start-menu"><BrandLogo decorative /> <span>start</span></button>
      <button type="button" className="taskbar-app" disabled={covered} onClick={() => {
        setOpen(false)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }}><BrandLogo decorative /><span>iLeak: HydroCharging</span></button>
      <div className="taskbar-tray">
        <HardwareBalloon cards={cards} active={active} hidden={open || restart || covered} />
        <button type="button" onClick={onSound} disabled={covered} aria-label={sound ? 'ปิดเสียง' : 'เปิดเสียง'} title={sound ? 'ปิดเสียง' : 'เปิดเสียง'}>{sound ? <Volume2 size={18} /> : <VolumeX size={18} />}</button>
        <time dateTime={now.toISOString()} title={now.toLocaleDateString('th-TH', { dateStyle: 'full' })}>{now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</time>
      </div>
      {restart && (
        <div className="restart-backdrop">
          <section className="restart-dialog xp-dialog" role="dialog" aria-modal="true" aria-labelledby="restart-title">
            <div className="xp-titlebar"><b id="restart-title">ปิดเครื่อง</b><button type="button" className="xp-close" onClick={() => setRestart(false)} disabled={restarting} aria-label="ปิดหน้าต่างรีสตาร์ท"><X size={16} /></button></div>
            <div className="restart-content"><Power size={48} /><h2>{restarting ? 'กำลังเริ่มต้นใหม่…' : 'ปิดเครื่องไม่ได้ น้ำยังท่วมอยู่'}</h2><p>รีสตาร์ทจะโหลดหน้าใหม่และเริ่มการประเมินอีกครั้ง</p>
              <div><button type="button" className="btn-gold" autoFocus disabled={restarting} onClick={() => {
                setRestarting(true)
                schemeSound('shutdown')
                timer.current = setTimeout(() => location.reload(), 1100)
              }}>รีสตาร์ท</button><button type="button" className="btn-line" disabled={restarting} onClick={() => {
                setRestart(false)
                start.current?.focus()
              }}>ยกเลิก</button></div>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
