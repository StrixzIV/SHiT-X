import { BatteryCharging, Cable, Cpu, EthernetPort, Gamepad2, Headphones, Keyboard, Monitor, Mouse, Pill, Smartphone, Usb } from 'lucide-react'

const ICONS = {
  serial: Cable, battery: BatteryCharging, webusb: Usb, audio: Headphones, display: Monitor,
  webhid: Keyboard, gamepad: Gamepad2, otg: Mouse, ethernet: EthernetPort, native: Smartphone, placebo: Pill,
}
const ART = {
  'USB-C': 'art-usbc', '3.5mm': 'art-jack', Ethernet: 'art-eth', ใจ: 'art-heart',
}

export default function JokerCard({ card, index, active, popup, onTap }) {
  const Icon = ICONS[card.id] ?? Cpu
  const status = !card.supported ? 'debuffed' : card.live ? 'live' : card.armed ? 'idle' : 'locked'

  const tilt = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    e.currentTarget.style.setProperty('--rx', `${x * 24}deg`)
    e.currentTarget.style.setProperty('--ry', `${-y * 24}deg`)
    e.currentTarget.style.setProperty('--mx', `${(x + 0.5) * 100}%`)
  }
  const untilt = (e) => {
    e.currentTarget.style.setProperty('--rx', '0deg')
    e.currentTarget.style.setProperty('--ry', '0deg')
  }

  return (
    <div className="joker-slot" style={{ '--i': index }}>
      <button
        type="button"
        className={`joker ${status} ${active ? 'juice' : ''}`}
        onPointerMove={tilt}
        onPointerLeave={untilt}
        onClick={() => onTap(card.id)}
        aria-label={`${card.name}: ${card.detail}`}
        title={card.detail}
      >
        <div className="joker-face">
          <div className={`joker-art ${ART[card.port] ?? 'art-usbc'}`}>
            <span className="joker-port">{card.port}</span>
            <Icon className="joker-icon" strokeWidth={2.2} />
            {status === 'live' && <span className="joker-zap">⚡</span>}
          </div>
          <div className="joker-name">{card.name}</div>
          <div className="joker-label">{card.label}</div>
          <div className={`joker-mult ${card.xmult ? 'x' : ''}`}>
            {card.xmult ? `X${card.xmult}` : `+${card.mult}`} Mult
          </div>
          <div className="joker-detail">{status === 'locked' ? card.hint ?? 'แตะเพื่อเปิด' : card.detail}</div>
        </div>
        {status === 'debuffed' && <div className="debuff-x" aria-hidden>✕</div>}
      </button>
      {popup && (
        <span key={popup.key} className={`popup ${popup.kind}`}>
          {popup.text}
        </span>
      )}
    </div>
  )
}
