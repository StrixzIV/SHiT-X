import { useEffect, useRef, useState } from 'react'
import { Award, PhoneCall, RotateCcw } from 'lucide-react'
import Certificate from './Certificate.jsx'
import { CountUp, WavyText } from './juice.jsx'
import { ORBITS, SCENES, SCENE_MS } from './scenes/index.js'
import Boot, { ZOOM_S } from './scenes/Boot.jsx'
import { useOrbit } from './scenes/orbit.js'
import { RESPONDERS } from '../../../game/responders.js'
import { chipSound, multSound, tick, xmultSound, zeroSound } from './sfx.js'
import { nudge, setStowaway } from '../companion/brain.js'
import './retro.css'

const VERDICT = [
  ['ปลอดภัย', 'ไม่พบพลังงานใดๆ ท่านปลอดภัย (และเรียบง่ายมาก)'],
  ['ไฟรั่วเล็กน้อย', 'มีไฟซึมพอให้รู้สึกจั๊กจี้ สมฐานะ'],
  ['ไฟรั่วระดับหรู', 'กระแสไฟในน้ำเทียบเท่าห้องรับรองชั้นธุรกิจ'],
  ['ไฟรั่วระดับพรีเมียม', 'ปลาในซอยเริ่มเรืองแสง'],
  ['น้ำท่วมทั้งซอยมีไฟ', 'เพื่อนบ้านได้ชาร์จมือถือฟรีจากความหรูหราของท่าน'],
  ['หายนะระดับชาติ', 'การไฟฟ้าขอให้ท่านถอดปลั๊กเพื่อความมั่นคงของชาติ'],
  ['ภัยพิบัติระดับหมอลำ', 'ไฟตกพร้อมกันทั้งอาเซียน ทุกหน่วยเตรียมรับมือ'],
  ['จักรวาลถูกรีสตาร์ท', 'ไฟรั่วของท่านกลืนทั้งกาแล็กซี เราสร้างจักรวาลใหม่ให้แล้ว (น้ำยังท่วมเหมือนเดิม)'],
]

// What each cutscene shows, for น้องปลั๊ก's remarks.
const SCENE_ABOUT = [
  'NES-style underwater level, Claude in a hard hat swimming: nothing happened, safe and boring',
  'Windows XP blue screen of death',
  'low-poly heaven: cloud stairs, god rays, a crowd waiting at the top',
  'low-poly flooded soi at night, lightning, a giant figure at the end of the street',
  'a skeleton being electrocuted, FAHHH',
  'Pokemon-style battle against the flood',
  'Metal Gear codec call about a mor lam concert blackout',
  'a black hole swallowing the galaxy',
]

const POPUP = { chips: (v) => `+${fmt(v)}`, mult: (v) => `+${v} Mult`, xmult: (v) => `X${v} Mult`, zero: () => 'X0' }
const SOUND = { chips: chipSound, mult: multSound, xmult: xmultSound, zero: zeroSound }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const fmt = (n) => (n >= 1e6 ? n.toExponential(2) : (+n.toFixed(1)).toLocaleString('en-US'))

// Loading (PS2-boot-style towers with the Balatro-style tally on top) → the
// camera dives into the towers and fades to black → the level's scene → the
// result sheet slides up over it (on L7 the black hole then grabs it and keeps
// it in orbit).
// `skip` (dev) cuts straight to the scene; `auto` (dev sequences) closes by itself.
export default function CalcOverlay({ score, tier, speed = 1, skip = false, auto = false, onClose }) {
  const { steps, total, level } = score
  const [phase, setPhase] = useState(skip ? 'scene' : 'loading') // loading | scene | result
  const [active, setActive] = useState(-1)
  const [tally, setTally] = useState({ chips: 0, mult: 1 })
  const [counting, setCounting] = useState(false)
  const [zoom, setZoom] = useState(false)
  const [cert, setCert] = useState(null)
  const autoClose = useRef(null)
  const sheet = useRef(null)
  const orbits = ORBITS.has(level)
  const note = useOrbit(sheet, phase === 'result' && orbits)
  useEffect(() => {
    autoClose.current = auto ? onClose : null
  })

  useEffect(() => {
    let dead = false
    let ticker
    const wait = (ms) => sleep(ms / speed)
    const run = async () => {
      if (!skip) {
        await wait(700)
        for (const [i, s] of steps.entries()) {
          if (dead) return
          setActive(i)
          setTally({ chips: s.chips, mult: s.mult })
          SOUND[s.kind](i)
          await wait(s.kind === 'xmult' ? 900 : s.kind === 'zero' ? 1100 : 560)
        }
        if (dead) return
        setActive(steps.length)
        setCounting(true)
        ticker = setInterval(() => tick(Math.random() * 40), 45)
        await wait(1600)
        clearInterval(ticker)
        if (dead) return
        setZoom(true)
        await wait(ZOOM_S * 1000)
        if (dead) return
        setPhase('scene')
      }
      await wait(skip ? 1200 : SCENE_MS[level])
      if (dead) return
      setPhase('result')
      if (!autoClose.current) return
      await wait(1200)
      if (!dead) autoClose.current?.()
    }
    run()
    return () => {
      dead = true
      clearInterval(ticker)
    }
  }, [steps, total, level, speed, skip])

  const Scene = SCENES[level]
  const [title, sub] = VERDICT[level]

  // On L7 her own Messenger window floats independently of the result sheet.
  useEffect(() => {
    if (phase === 'loading') nudge('calc', { chips: steps.length, note: 'Balatro-style score tally, then a PS2 boot zoom' }, 1)
    else if (phase === 'scene') nudge('scene', { level, of: 7, verdict: title, scene: SCENE_ABOUT[level] }, 2)
    else if (orbits) {
      setStowaway(true)
      nudge('l7:pulled', { note: 'your whole Messenger window is orbiting the black hole independently; each finished MSN notification gets sucked in and floats around too', volts: fmt(total) }, 2)
    } else nudge('result', { level, volts: fmt(total), verdict: title, responder: RESPONDERS[level].org, reply: RESPONDERS[level].reply }, 2)
  }, [phase, level, orbits, steps.length, title, total])
  useEffect(() => () => setStowaway(false), [])
  const close = () => {
    if (orbits) setStowaway(false)
    onClose()
    // React removes the scene before she reacts to being back on the desktop.
    setTimeout(() => nudge(orbits && phase === 'result' ? 'l7:released' : 'again', { note: orbits ? 'the user closed the black-hole result; you are free again' : 'the user wants to appraise again' }, 2), 0)
  }

  return (
    <div className={`calc phase-${phase}${zoom && phase === 'loading' ? ' zooming' : ''}`} data-level={level} data-scene={SCENE_ABOUT[level]} data-verdict={title} data-volts={fmt(total)} role="dialog" aria-modal="true" aria-label="ผลการคำนวณ">
      {phase === 'loading' ? (
        <>
          <Boot zoom={zoom} speed={speed} />
          <div className="calc-stage">
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
              <div className="tb-total">
                {counting ? <>= <CountUp value={total} ms={1100 / speed} format={fmt} /> V</> : '= ??? V'}
              </div>
            </div>
          </div>
        </>
      ) : (
        <Scene total={total} speed={speed} tier={tier} uiRef={orbits ? sheet : undefined} />
      )}

      {phase === 'result' && (
        <div ref={sheet} className={`result${orbits ? ' orbit' : ''}`} tabIndex={orbits ? 0 : undefined}>
          <div className="result-head">
            <b>{fmt(total)} V</b>
            <WavyText text={title} className="verdict" />
          </div>
          {orbits && <small className="orbit-hint">ลากหัวการ์ดเพื่อเหวี่ยง · ปล่อยไว้เดี๋ยวโดนกิน</small>}
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
          {cert && <Certificate cert={cert} tier={tier} volts={fmt(total)} verdict={title} />}
          <div className="result-foot">
            {!cert && (
              <button type="button" className="btn-line" onClick={() => { nudge('cert', { tier: tier.id }, 1); setCert({ id: `ILEAK-${tier.id}-${Math.floor(1000 + Math.random() * 9000)}`, date: new Date().toLocaleDateString('th-TH') }) }}>
                <Award size={18} /> ออกใบรับรอง
              </button>
            )}
            <button type="button" className="btn-gold" onClick={close}><RotateCcw size={18} /> ประเมินใหม่</button>
          </div>
        </div>
      )}
      {note && <p className="orbit-note" aria-live="polite">{note}</p>}
    </div>
  )
}
