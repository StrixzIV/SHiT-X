import { Crown, LogIn, Volume2, VolumeX } from 'lucide-react'

export default function PortalHeader({ sound, onSound }) {
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
