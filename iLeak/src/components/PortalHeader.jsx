import { LogIn, Volume2, VolumeX, Zap } from 'lucide-react'

export default function PortalHeader({ page, sound, onSound, dark }) {
  return (
    <header className={`portal ${dark ? 'dark' : ''}`}>
      <a href="#/" className="portal-brand">
        <span className="portal-logo"><Zap size={20} fill="currentColor" /></span>
        <span>
          <b>KMITL STUPID LAB</b>
          <small>Flood Electricity Division · iLeak</small>
        </span>
      </a>
      <nav className="portal-nav">
        <a href="#/" className={page === 'probe' ? 'on' : ''}>⚡ เช็คไฟรั่ว</a>
        <a href="#/briefing" className={page === 'briefing' ? 'on' : ''}>📖 อ่านก่อนจุ่ม</a>
      </nav>
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
