import { useEffect, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import JokerCard from '../components/JokerCard.jsx'
import ScorePanel from '../components/ScorePanel.jsx'
import CashOut from '../components/CashOut.jsx'
import SwirlBackground from '../fx/SwirlBackground.jsx'
import { WavyText } from '../fx/juice.jsx'
import { beep, chime, safe, shock } from '../fx/sfx.js'
import { scoreHand } from '../game/score.js'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export default function ProbePage({ cards, tap, voucher }) {
  const root = useRef(null)
  const [phase, setPhase] = useState('idle') // idle | playing | done
  const [shown, setShown] = useState(null)
  const [active, setActive] = useState(null)
  const [popups, setPopups] = useState({})
  const [flash, setFlash] = useState(null)
  const [result, setResult] = useState(null)

  const preview = scoreHand(cards, { voucher })
  const liveCount = cards.filter((c) => c.supported && c.live).length
  const supported = cards.filter((c) => c.supported).length
  const tally = shown ?? { chips: preview.chips, mult: preview.mult, total: 0, leak: false }

  const kick = (level) => {
    const el = root.current
    if (!el) return
    el.classList.remove('shake-small', 'shake-mid', 'shake-big')
    void el.offsetWidth
    el.classList.add(`shake-${level}`)
  }

  // A cable going live outside of a hand still gets a jolt, like the original app.
  const prevLive = useRef(liveCount)
  useEffect(() => {
    if (phase === 'idle' && liveCount > prevLive.current) {
      beep(880, 0.2, 'sawtooth', 0.15, 220)
      navigator.vibrate?.([120, 60, 120])
      kick('mid')
    }
    prevLive.current = liveCount
  }, [liveCount, phase])

  const play = async () => {
    if (phase !== 'idle') return
    const r = scoreHand(cards, { voucher })
    setPhase('playing')
    setPopups({})
    setShown({ chips: r.hand.chips, mult: r.hand.mult + (voucher ? 1 : 0), total: 0, leak: false })
    beep(220, 0.15, 'square')
    await sleep(450)

    for (const [i, s] of r.steps.entries()) {
      setActive(s.id)
      setPopups((p) => ({ ...p, [s.id]: { text: s.text, kind: s.kind, key: i } }))
      setShown({ chips: s.chips, mult: s.mult, total: 0, leak: false })
      chime(i, s.kind)
      kick(s.kind === 'xmult' ? 'mid' : 'small')
      await sleep(s.kind === 'xmult' ? 560 : 380)
    }
    setActive(null)
    await sleep(200)
    setShown({ chips: r.chips, mult: r.mult, total: r.total, leak: r.leak })
    await sleep(700)

    if (r.leak) {
      shock()
      kick('big')
      setFlash('leak')
      confetti({ particleCount: 160, spread: 360, startVelocity: 55, ticks: 90, origin: { y: 0.45 }, colors: ['#ffd23f', '#ff4c40', '#ffffff', '#e35205'], shapes: ['circle'], scalar: 0.8 })
    } else {
      safe()
      setFlash('safe')
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.8 }, colors: ['#0093ff', '#4bc292', '#ffffff'] })
    }
    await sleep(1400)
    setFlash(null)
    setResult(r)
    setPhase('done')
  }

  const reset = () => {
    setResult(null)
    setShown(null)
    setPopups({})
    setPhase('idle')
  }

  const mood = tally.leak ? 'leak' : liveCount > 0 ? 'live' : 'calm'

  return (
    <>
      <SwirlBackground mood={mood} />
      {flash && <div className={`flash ${flash}`} aria-hidden />}
      <div ref={root} className="table">

      <ScorePanel
        hand={preview.hand}
        chips={tally.chips}
        mult={tally.mult}
        total={tally.total}
        leak={tally.leak}
        liveCount={liveCount}
        voucher={voucher}
      />

      <section className="hand-area">
        <div className="hand-head">
          <h1><WavyText text="เครื่องตรวจไฟรั่วในน้ำท่วม" /></h1>
          <p>
            จุ่มปลายสายลงน้ำท่วม แล้วเสียบอีกด้านเข้าเครื่อง — <b>USB-C ดีที่สุด</b> แต่สายอะไรก็นับหมด.
            เครื่องนี้รองรับ <b>{supported}/{cards.length}</b> พอร์ต · มีไฟอยู่ <b>{liveCount}</b> สาย
          </p>
        </div>

        <div className="hand">
          {cards.map((c, i) => (
            <JokerCard key={c.id} card={c} index={i} active={active === c.id} popup={popups[c.id]} onTap={tap} />
          ))}
        </div>

        <div className="play-row">
          <button type="button" className="btn play" onClick={play} disabled={phase !== 'idle'}>
            {phase === 'playing' ? 'กำลังสแกนสเปกตรัม…' : 'จุ่มสาย! (Play Hand)'}
          </button>
          <a className="btn ghost" href="#/briefing">อ่านก่อนจุ่ม</a>
        </div>
      </section>
      </div>
      {result && <CashOut result={result} cards={cards} onClose={reset} />}
    </>
  )
}
