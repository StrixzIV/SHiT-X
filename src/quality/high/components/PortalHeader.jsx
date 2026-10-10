import { Crown, LogIn, Volume2, VolumeX, Sparkles } from 'lucide-react'
import { QUALITIES } from '../../qualityUrl.js'

export default function PortalHeader({ sound, onSound, quality = 'high', onQualityChange, onOpenQualityGate }) {
  return (
    <header className="portal">
      <div className="portal-brand">
        <span className="portal-logo"><Crown size={18} /></span>
        <span>
          <b>iLeak <em>Prestige</em></b>
          <small>KMITL STUPID LAB · Flood Electricity Division</small>
        </span>
      </div>
      <div className="portal-tools">
        {/* Quality selector dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <select
            value={quality}
            onChange={(e) => onQualityChange?.(e.target.value)}
            aria-label="เลือกระดับกราฟิก"
            title="เลือกระดับกราฟิก"
            style={{
              background: 'var(--ink-3)',
              color: 'var(--gold-hi)',
              border: '1px solid var(--gold)',
              borderRadius: 999,
              padding: '6px 12px',
              font: "600 13px 'Prompt', sans-serif",
              cursor: 'pointer',
              textTransform: 'uppercase',
            }}
          >
            {QUALITIES.map((q) => (
              <option key={q} value={q}>
                {q.toUpperCase()}
              </option>
            ))}
          </select>
          {onOpenQualityGate && (
            <button
              type="button"
              onClick={onOpenQualityGate}
              title="เปิดหน้าต่างตั้งค่ากราฟิก"
              aria-label="เปิดหน้าต่างตั้งค่ากราฟิก"
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '7px',
                borderRadius: '50%',
                background: 'transparent',
                border: '1px solid var(--line)',
                color: 'var(--gold)',
                cursor: 'pointer',
              }}
            >
              <Sparkles size={14} />
            </button>
          )}
        </div>

        <button type="button" onClick={onSound} aria-label={sound ? 'ปิดเสียง' : 'เปิดเสียง'}>
          {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
        <button type="button" className="login" onClick={() => alert('เซิร์ฟเวอร์จมน้ำอยู่ ไม่สามารถเข้าสู่ระบบได้')}>
          <LogIn size={16} /> <span>เข้าสู่ระบบ</span>
        </button>
      </div>
    </header>
  )
}
