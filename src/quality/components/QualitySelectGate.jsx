import { useState } from 'react'
import { Sparkles, Zap, Feather } from 'lucide-react'
import { QUALITIES, DEFAULT_QUALITY } from '../qualityUrl.js'
import { setDevInUrl } from '../high/session.js'

const QUALITY_INFO = {
  high: {
    title: 'High',
    subtitle: 'เต็มระบบ WebGL, เอฟเฟกต์ไฟกระพริบ, Balatro, และเสียงสมจริง',
    icon: Sparkles,
    badge: 'แนะนำ',
  },
  medium: {
    title: 'Medium',
    subtitle: 'Blank layout (ยังไม่เปิดใช้งาน)',
    icon: Zap,
    badge: null,
  },
  low: {
    title: 'Low',
    subtitle: 'Blank layout (ยังไม่เปิดใช้งาน)',
    icon: Feather,
    badge: null,
  },
}

export default function QualitySelectGate({ currentQuality = DEFAULT_QUALITY, onSelect }) {
  const [selected, setSelected] = useState(currentQuality)

  return (
    <div className="gate" role="dialog" aria-modal="true" aria-labelledby="quality-gate-title">
      {/* TEMP: DEV tickbox stays reachable here too — remove before the final push. */}
      <label className="dev-toggle quality-dev" title="โหมดนักพัฒนา: เข้า High พร้อมแผง DEV">
        <input
          type="checkbox"
          onChange={(e) => {
            if (!e.target.checked) return
            setDevInUrl(true)
            onSelect('high')
          }}
        />
        <span>DEV</span>
      </label>
      <div className="gate-sheet" style={{ maxWidth: 540 }}>
        <header className="gate-head" style={{ textAlign: 'center' }}>
          <span className="eyebrow">GRAPHIC QUALITY CONFIGURATION</span>
          <h1 id="quality-gate-title">
            เลือกระดับ <em>กราฟิก</em>
          </h1>
          <p>
            เลือกรูปแบบประสบการณ์ที่เหมาะสมกับอุปกรณ์และกำลังไฟของท่าน
          </p>
        </header>

        <section style={{ display: 'grid', gap: 12 }}>
          {QUALITIES.map((q) => {
            const info = QUALITY_INFO[q]
            const Icon = info.icon
            const isSelected = selected === q
            return (
              <button
                key={q}
                type="button"
                className={`tile ${isSelected ? 'live' : ''}`}
                style={{
                  padding: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  textAlign: 'left',
                  cursor: 'pointer',
                  border: isSelected ? '1px solid var(--gold)' : '1px solid #2b2b31',
                  background: isSelected ? 'rgb(212 175 55 / 0.12)' : 'var(--ink-2)',
                  borderRadius: 14,
                }}
                onClick={() => setSelected(q)}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: '50%',
                    display: 'grid',
                    placeItems: 'center',
                    background: isSelected ? 'var(--gold)' : '#2a2a30',
                    color: isSelected ? '#1b1405' : 'var(--text)',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <b style={{ fontSize: 16 }}>{info.title}</b>
                    {info.badge && (
                      <span
                        style={{
                          fontSize: 11,
                          padding: '1px 8px',
                          borderRadius: 999,
                          background: 'var(--gold)',
                          color: '#1b1405',
                          fontWeight: 700,
                        }}
                      >
                        {info.badge}
                      </span>
                    )}
                  </div>
                  <small style={{ color: 'var(--muted)', display: 'block', marginTop: 3 }}>
                    {info.subtitle}
                  </small>
                </div>
              </button>
            )
          })}
        </section>

        <footer style={{ marginTop: 12 }}>
          <button
            type="button"
            className="btn-gold wide"
            onClick={() => onSelect(selected)}
          >
            เข้าสู่ระบบ ({selected.toUpperCase()})
          </button>
        </footer>
      </div>
    </div>
  )
}
