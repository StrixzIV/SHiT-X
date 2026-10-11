import { useEffect, useRef } from 'react'
import { PlugZap } from 'lucide-react'
import RetroSwitch from './RetroSwitch.jsx'

// The header sits above every overlay (agreement, calculation, blue screen) so the
// DEV tickbox is always reachable; overlays read --header-h to start below it.
export default function PortalHeader({ dev, onDev, panel, onPanel, children }) {
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
        <span className="portal-logo"><PlugZap size={23} /></span>
        <span>
          <b>iLeak: <em>HydroCharging</em></b>
          <small>KMITL STUPID LAB · Flood Electricity Division</small>
        </span>
      </div>
      <div className="portal-tools">
        <RetroSwitch />
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
      </div>
      {children}
    </header>
  )
}
