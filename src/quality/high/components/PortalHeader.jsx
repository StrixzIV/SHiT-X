import { useEffect, useRef } from 'react'
import { Crown, LogIn, Sparkles, Volume2, VolumeX } from 'lucide-react'
import { QUALITIES } from '../../qualityUrl.js'

// The header sits above every overlay (agreement, calculation, blue screen) so the
// DEV tickbox is always reachable; overlays read --header-h to start below it.
export default function PortalHeader({ sound, onSound, dev, onDev, panel, onPanel, quality = 'high', onQualityChange, onOpenQualityGate, children }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    const set = () => document.documentElement.style.setProperty('--header-h', `${el.offsetHeight}px`)
    set()
    if (!('ResizeObserver' in window)) {
      addEventListener('resize', set)
      return () => removeEventListener('resize', set)
    }
    const ro = new ResizeObserver(set)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <header ref={ref} className="portal">
      <div className="portal-brand">
        <span className="portal-logo"><Crown size={18} /></span>
        <span>
          <b>iLeak <em>Prestige</em></b>
          <small>KMITL STUPID LAB · Flood Electricity Division</small>
        </span>
      </div>
      <div className="portal-tools">
        {/* graphic quality (quality/QualityRouter.jsx) */}
        <select
          className="quality-select"
          value={quality}
          onChange={(e) => onQualityChange?.(e.target.value)}
          aria-label="เลือกระดับกราฟิก"
          title="เลือกระดับกราฟิก"
        >
          {QUALITIES.map((q) => (
            <option key={q} value={q}>{q.toUpperCase()}</option>
          ))}
        </select>
        {onOpenQualityGate && (
          <button type="button" className="quality-open" onClick={onOpenQualityGate} title="เปิดหน้าต่างตั้งค่ากราฟิก" aria-label="เปิดหน้าต่างตั้งค่ากราฟิก">
            <Sparkles size={14} />
          </button>
        )}
        {/* TEMP: always visible (even on iOS) while the team tests — remove before the final push. */}
        <label className={`dev-toggle ${dev ? 'on' : ''}`} title="โหมดนักพัฒนา: ข้ามข้อตกลง ปรับค่าได้ทุกอย่าง">
          <input type="checkbox" checked={dev} onChange={(e) => onDev(e.target.checked)} />
          <span>DEV</span>
        </label>
        {dev && (
          <button type="button" className="dev-menu" onClick={onPanel} aria-expanded={panel} aria-label="แผง DEV">
            {panel ? '▴' : '▾'}
          </button>
        )}
        <button type="button" onClick={onSound} aria-label={sound ? 'ปิดเสียง' : 'เปิดเสียง'}>
          {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
        <button type="button" className="login" onClick={() => alert('เซิร์ฟเวอร์จมน้ำอยู่ ไม่สามารถเข้าสู่ระบบได้')}>
          <LogIn size={16} /> <span>เข้าสู่ระบบ</span>
        </button>
      </div>
      {children}
    </header>
  )
}
