import { useEffect, useRef, useState } from 'react'
import { Cable, X } from 'lucide-react'
import { schemeSound } from '../sound/scheme.js'

export default function HardwareBalloon({ cards, active, hidden }) {
  const previous = useRef(null)
  const serial = useRef(0)
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    const next = Object.fromEntries(cards.map((card) => [card.id, !!card.live]))
    if (previous.current && active) {
      const changed = cards.filter((card) => next[card.id] !== previous.current[card.id])
      if (changed.length) {
        const card = changed[changed.length - 1]
        schemeSound(card.live ? 'deviceConnect' : 'deviceDisconnect')
        setNotice({ id: ++serial.current, connected: !!card.live, name: changed.map((item) => item.name).join(' · ') })
      }
    }
    previous.current = next
  }, [cards, active])

  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(null), 5000)
    return () => clearTimeout(timer)
  }, [notice])

  if (!notice || !active || hidden) return null
  return (
    <aside className="hardware-balloon" role="status" aria-live="polite">
      <Cable size={25} aria-hidden="true" />
      <div>
        <b>{notice.connected ? 'พบฮาร์ดแวร์ใหม่' : 'ถอดฮาร์ดแวร์แล้ว'}</b>
        <small>{notice.connected ? 'Found New Hardware' : 'Hardware disconnected'}</small>
        <p>{notice.name}</p>
      </div>
      <button type="button" onClick={() => setNotice(null)} aria-label="ปิดการแจ้งเตือนฮาร์ดแวร์"><X size={14} /></button>
    </aside>
  )
}
