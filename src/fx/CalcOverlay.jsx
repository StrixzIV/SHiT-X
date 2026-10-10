import { useEffect, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import { Award, PhoneCall, Printer, RotateCcw } from 'lucide-react'
import SwirlBackground from './SwirlBackground.jsx'
import Chaos from './Chaos.jsx'
import { CountUp, WavyText } from './juice.jsx'
import { RESPONDERS } from '../game/responders.js'
import { beep, boom, chipSound, multSound, safe, shock, siren, tick, xmultSound, zeroSound } from './sfx.js'

const VERDICT = [
  ['ปลอดภัย', 'ไม่พบพลังงานใดๆ ท่านปลอดภัย (และเรียบง่ายมาก)'],
  ['ไฟรั่วเล็กน้อย', 'มีไฟซึมพอให้รู้สึกจั๊กจี้ สมฐานะ'],
  ['ไฟรั่วระดับหรู', 'กระแสไฟในน้ำเทียบเท่าห้องรับรองชั้นธุรกิจ'],
  ['ไฟรั่วระดับพรีเมียม', 'ปลาในซอยเริ่มเรืองแสง'],
  ['น้ำท่วมทั้งซอยมีไฟ', 'เพื่อนบ้านได้ชาร์จมือถือฟรีจากความหรูหราของท่าน'],
  ['หายนะระดับชาติ', 'การไฟฟ้าขอให้ท่านถอดปลั๊กเพื่อความมั่นคงของชาติ'],
  ['วิกฤตพลังงานโลก', 'ไฟตกพร้อมกันทั้งอาเซียน สหประชาชาติเรียกประชุมด่วนเพราะท่าน'],
  ['จักรวาลถูกรีสตาร์ท', 'ไฟรั่วของท่านกลืนทั้งกาแล็กซี เราสร้างจักรวาลใหม่ให้แล้ว (น้ำยังท่วมเหมือนเดิม)'],
]

const POPUP = { chips: (v) => `+${fmt(v)}`, mult: (v) => `+${v} Mult`, xmult: (v) => `X${v} Mult`, zero: () => 'X0' }
const SOUND = { chips: chipSound, mult: multSound, xmult: xmultSound, zero: zeroSound }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const fmt = (n) => (n >= 1e6 ? n.toExponential(2) : (+n.toFixed(1)).toLocaleString('en-US'))

export default function CalcOverlay({ score, tier, speed = 1, onClose }) {
  const { steps, total, level } = score
  const [phase, setPhase] = useState('score') // score | bsod | reveal | collapse | result
  const [active, setActive] = useState(-1)
  const [tally, setTally] = useState({ chips: 0, mult: 1 })
  const [shownTotal, setShownTotal] = useState(null)
  const [bang, setBang] = useState(false)
  const [cert, setCert] = useState(null)
  const stage = useRef(null)

  const kick = (cls) => {
    const el = stage.current
    if (!el) return
    el.classList.remove('shake-small', 'shake-mid', 'shake-big')
    void el.offsetWidth
    el.classList.add(cls)
  }

  useEffect(() => {
    let dead = false
    const wait = (ms) => sleep(ms / speed)
    const run = async () => {
      setActive(-1)
      setTally({ chips: 0, mult: 1 })
      await wait(600)

      // 1. each source scores in turn, Balatro-style
      for (const [i, s] of steps.entries()) {
        if (dead) return
        setActive(i)
        setTally({ chips: s.chips, mult: s.mult })
        SOUND[s.kind](i)
        kick(s.kind === 'xmult' || s.kind === 'zero' ? 'shake-mid' : 'shake-small')
        await wait(s.kind === 'xmult' ? 900 : s.kind === 'zero' ? 1100 : 520)
      }
      setActive(steps.length)
      await wait(400)
      if (dead) return

      // 2. the absurd part
      if (level >= 5) {
        setPhase('bsod')
        siren(level >= 6 ? 3 : 2)
        await wait(2200)
        if (dead) return
      }
      setPhase('reveal')
      setShownTotal(total)
      const countMs = (900 + level * 250) / speed
      const ticker = setInterval(() => tick(Math.random() * 40), 45)
      setTimeout(() => clearInterval(ticker), countMs)

      if (level === 0) {
        safe()
        confetti({ particleCount: 70, spread: 80, origin: { y: 0.7 }, colors: ['#7dd3fc', '#86efac', '#ffffff'] })
      } else {
        await wait(countMs * 0.8)
        if (dead) return
        shock()
        if (level >= 2) boom(Math.min(1, (level - 1) / 4))
        kick(level >= 4 ? 'shake-big' : level >= 2 ? 'shake-mid' : 'shake-small')
        const bursts = Math.min(level, 6)
        for (let i = 0; i < bursts; i++) {
          setTimeout(() => confetti({ particleCount: 50 * Math.min(level, 5), spread: 360, startVelocity: 25 + level * 8, ticks: 120, origin: { x: 0.2 + Math.random() * 0.6, y: 0.3 + Math.random() * 0.3 }, colors: ['#ffd23f', '#ff4c40', '#ffffff', '#e35205', '#d4af37'] }), i * 260)
        }
      }

      if (level >= 7) {
        // 3. the universe collapses into a singularity, then a big bang
        await wait(1800)
        if (dead) return
        setPhase('collapse')
        beep(80, 2.6 / speed, 'sawtooth', 0.2, 20)
        await wait(2700)
        if (dead) return
        setBang(true)
        boom(1)
        setPhase('reveal')
        await wait(900)
        setBang(false)
      }

      await wait(1500 + level * 250)
      if (!dead) setPhase('result')
    }
    run()
    return () => { dead = true }
  }, [steps, total, level, speed])

  const revealed = shownTotal != null
  const mood = !revealed ? (level === 0 ? 'calm' : 'live') : level === 0 ? 'calm' : level >= 7 ? 'void' : 'leak'
  const wild = revealed && phase !== 'collapse' ? `lvl-${level}` : ''
  const [title, sub] = VERDICT[level]

  return (
    <div className={`calc ${wild} ${phase === 'collapse' ? 'singularity' : ''}`} role="dialog" aria-modal="true" aria-label="ผลการคำนวณ">
      <SwirlBackground mood={mood} />
      {revealed && level >= 3 && <Chaos level={level} />}
      {revealed && level === 0 && <div className="bubbles" aria-hidden>{Array.from({ length: 18 }, (_, i) => <span key={i} style={{ '--i': i }} />)}</div>}
      {revealed && level >= 6 && phase !== 'collapse' && (
        <>
          <div className="nuke" aria-hidden />
          <div className="invert-pulse" aria-hidden />
          <div className="ticker" aria-hidden>
            <span>ด่วน! การไฟฟ้าประกาศภาวะฉุกเฉินระดับโลก · หัวชาร์จระดับ {tier.id} ถูกตรวจพบในน้ำท่วม · NASA ขอให้ถอดปลั๊ก · ตลาดหุ้นปิดทำการ · ปลาทั้งคลองได้รับปริญญาวิศวกรรมไฟฟ้า ·&nbsp;</span>
          </div>
        </>
      )}
      {phase === 'collapse' && <div className="blackhole" aria-hidden />}
      {bang && <div className="bigbang" aria-hidden />}
      {phase === 'bsod' && (
        <div className="bsod">
          <div className="bsod-face">:(</div>
          <p>อุปกรณ์ของท่านหรูหราเกินกว่าน้ำท่วมจะรับไหว และต้องรีสตาร์ทประเทศ</p>
          <p className="bsod-code">STOP CODE: TIER_{tier.id}_TOO_RICH_FOR_FLOOD</p>
        </div>
      )}

      <div ref={stage} className="calc-stage">
        <div className="calc-wobble">
          <div className="score-cards">
            {steps.map((s, i) => (
              <div key={`${s.id}-${i}`} className={`sc ${s.kind} ${i === active ? 'juice' : ''} ${i <= active ? 'done' : ''}`}>
                <b>{s.label}</b>
                <small>{s.sub}</small>
                <span className="sc-eff">{POPUP[s.kind](s.value)}</span>
                {i === active && <span className={`popup ${s.kind}`}>{POPUP[s.kind](s.value)}</span>}
              </div>
            ))}
          </div>

          <div className="tally-big">
            <div className="tb-row">
              <div className="tb chips"><small>Chips</small><CountUp value={tally.chips} ms={250 / speed} format={fmt} /></div>
              <span className="tb-x">X</span>
              <div className="tb mult"><small>Mult</small><CountUp value={tally.mult} ms={250 / speed} format={fmt} /></div>
            </div>
            <div className={`tb-total ${revealed && level >= 3 ? 'glitch' : ''}`} data-text={revealed ? `${fmt(total)} V` : ''}>
              {!revealed ? '= ??? V' : <>= <CountUp value={total} ms={(900 + level * 250) / speed} format={fmt} /> V</>}
              {revealed && level >= 2 && <span className="flames" aria-hidden />}
            </div>
            {revealed && <WavyText text={title} className={`verdict v${Math.min(level, 5)}`} />}
          </div>
        </div>
      </div>

      {phase === 'result' && (
        <div className="result">
          <p className="result-sub">{sub}</p>
          <ol className="chain">
            {RESPONDERS.slice(0, level).map((r) => (
              <li key={r.org} className="passed"><s>{r.org}</s> <span>เกินอำนาจ ส่งเรื่องต่อ</span></li>
            ))}
          </ol>
          <div className={`responder r${level}`}>
            <span className="eyebrow">ผู้รับเรื่อง · ระดับ {level}/7</span>
            <h3>{RESPONDERS[level].org}</h3>
            <small className="who">{RESPONDERS[level].who}</small>
            <p className="reply">“{RESPONDERS[level].reply}”</p>
            <div className="responder-foot">
              <span>จะติดต่อกลับ: <b>{RESPONDERS[level].eta}</b></span>
              {RESPONDERS[level].action && (
                <a className="act" href={RESPONDERS[level].action[1]} target="_blank" rel="noopener noreferrer">
                  <PhoneCall size={18} /> {RESPONDERS[level].action[0]}
                </a>
              )}
            </div>
          </div>
          {cert && (
            <div className="cert">
              <div className="cert-id">CERTIFICATE ID: {cert.id}</div>
              <h3>หนังสือรับรองระดับชั้นทางพลังงาน</h3>
              <p>ระดับ <b>{tier.id}</b> · {tier.title} · {cert.date}</p>
              <p>ผลการตรวจวัด: <b>{fmt(total)} V</b> ({title})</p>
              <p className="cert-fine">ใช้เพื่อความบันเทิงใน The Stupid Hackathon Thailand เท่านั้น อวดได้ แต่เคลมประกันไม่ได้</p>
              <button type="button" className="btn-line" onClick={() => window.print()}><Printer size={16} /> พิมพ์</button>
            </div>
          )}
          <div className="result-foot">
            {!cert && (
              <button type="button" className="btn-line" onClick={() => setCert({ id: `ILEAK-${tier.id}-${Math.floor(1000 + Math.random() * 9000)}`, date: new Date().toLocaleDateString('th-TH') })}>
                <Award size={18} /> ออกใบรับรอง
              </button>
            )}
            <button type="button" className="btn-gold" onClick={onClose}><RotateCcw size={18} /> ประเมินใหม่</button>
          </div>
        </div>
      )}
    </div>
  )
}
