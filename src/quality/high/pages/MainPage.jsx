import { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import Appraisal from '../components/Appraisal.jsx'
import Peripherals from '../components/Peripherals.jsx'
import HoldButton from '../components/HoldButton.jsx'
import PlugAssistant from '../components/PlugAssistant.jsx'
import CalcOverlay from '../fx/CalcOverlay.jsx'
import { estimateWatts, readSpecs, specBonus, tierFor } from '../../../appraisal/specs.js'
import { computeScore } from '../../../game/score.js'
import { big } from '../../../game/format.js'
import { reloadForBattery } from '../session.js'

// Smallest total that lands on each FX level, nudged up a bit (for dev firing).
const LEVEL_TARGET = [0, 500, 3000, 12000, 50000, 300000, 5e9, 1e20]

// `knobs` and `skips` come from the DEV panel and only apply while `dev` is on.
// `apiRef` exposes fire / sequence / stop / replay to that panel.
export default function MainPage({ cards, tap, refresh, dev, skips, knobs, apiRef, onInfo, onOverlayChange }) {
  const [specs, setSpecs] = useState(null)
  const [override, setOverride] = useState(null)
  // Manual power answer: null = not answered, true = "charging" (manual charge), false = "not plugged".
  const [manual, setManual] = useState(null)
  const [checking, setChecking] = useState(false)
  const [rechecked, setRechecked] = useState(false)
  const [stamped, setStamped] = useState(false)
  const [run, setRun] = useState(null) // snapshot of the score while the overlay is open
  const [queue, setQueue] = useState([]) // dev stress test: levels (or 'real') to fire one after another
  const [instant, setInstant] = useState(dev && skips.appraisal)
  const [replay, setReplay] = useState(0)
  useEffect(() => {
    onOverlayChange?.(!!run)
    return () => onOverlayChange?.(false)
  }, [run, onOverlayChange])

  useEffect(() => {
    // a beat of suspense before the appraisal starts typing
    const t = setTimeout(() => readSpecs().then(setSpecs), instant ? 0 : 900)
    return () => clearTimeout(t)
  }, [instant, replay])

  const battery = cards.find((c) => c.id === 'battery')
  const batteryKnown = battery.supported
  const charging = batteryKnown && battery.live
  const devPowerOn = dev && knobs.power !== 'auto'
  const powered = devPowerOn ? knobs.power === 'on' : charging || manual === true
  // Browsers that can't read charging (Safari, Firefox, Brave, http — and iOS via the dev skip) must answer by hand first.
  const mustAnswer = !batteryKnown && manual === null && !devPowerOn && !(dev && skips.manual)
  const recheck = async () => {
    setChecking(true)
    await Promise.all([refresh('battery'), readSpecs().then(setSpecs), new Promise((r) => setTimeout(r, 600))])
    setChecking(false)
    setRechecked(true)
  }
  const power = {
    known: batteryKnown,
    charging,
    level: battery.level ?? specs?.battery?.level ?? null,
    why: battery.detail,
    manual,
    setManual,
    recheck,
    checking,
    rechecked,
    reload: reloadForBattery,
  }
  const est = specs ? estimateWatts(specs) : { watts: 0, why: '' }
  const watts = (dev ? knobs.watts : null) ?? override ?? est.watts
  const tier = tierFor(watts)
  const bonus = specs ? specBonus(specs) : 0
  const peripherals = cards.filter((c) => c.id !== 'battery')
  const score = computeScore({ watts, bonus, tier, peripherals, powered, fakeUsbC: dev ? knobs.fake : 0 })
  const onStamped = useCallback(() => setStamped(true), [])

  // Every run gets its own id so a new fire always starts a fresh overlay.
  const runId = useRef(0)
  const fire = (level) => {
    runId.current += 1
    if (level == null) return setRun({ id: runId.current, score, tier })
    const w = level === 0 ? watts : Math.ceil(LEVEL_TARGET[level] / tier.mult)
    setRun({ id: runId.current, score: computeScore({ watts: w, bonus: 0, tier, peripherals: [], powered: level > 0 }), tier })
  }

  // The panel and the sequence runner always call the latest `fire`.
  const fireRef = useRef(fire)
  useEffect(() => {
    fireRef.current = fire
  })

  useImperativeHandle(apiRef, () => ({
    fire: (level) => fireRef.current(level),
    sequence: (list) => {
      setRun(null)
      setQueue(list)
    },
    stop: () => setQueue([]),
    replay: () => {
      setInstant(false)
      setStamped(false)
      setSpecs(null)
      setReplay((n) => n + 1)
    },
  }))

  // Sequence runner: whenever the overlay is closed, fire the next queued item.
  useEffect(() => {
    if (run || queue.length === 0) return
    const t = setTimeout(() => {
      const [next, ...rest] = queue
      setQueue(rest)
      fireRef.current(next === 'real' ? null : next)
    }, 300)
    return () => clearTimeout(t)
  }, [run, queue])

  // Live numbers for the DEV panel header (plus the raw specs for its dump).
  const reportKey = specs
    ? JSON.stringify({ watts, tier: tier.id, chips: score.chips, mult1: score.mult1, mult2: score.mult2, total: score.total, level: score.level })
    : ''
  const latest = useRef({ specs, est })
  useEffect(() => {
    latest.current = { specs, est }
  })
  useEffect(() => {
    onInfo?.(reportKey ? { ...JSON.parse(reportKey), ...latest.current } : null)
  }, [reportKey, onInfo])
  useEffect(() => () => onInfo?.(null), [onInfo])

  return (
    <main className="main">
      <Appraisal
        key={replay}
        specs={specs}
        est={est}
        watts={watts}
        override={override}
        setOverride={setOverride}
        tier={tier}
        bonus={bonus}
        power={power}
        stamped={stamped}
        onStamped={onStamped}
        instant={instant}
      />

      {stamped && (
        <>
          <Peripherals items={peripherals} tap={tap} mult2={score.mult2} />

          <section className="panel finale">
            <span className="eyebrow">ขั้นที่ 3 · จุ่มสายและคำนวณ</span>
            <div className="formula">
              <span className="f chips"><small>พลัง</small>{big(score.chips)}</span>
              <span className="fx">X</span>
              <span className="f mult"><small>mult<sub>1</sub> {tier.id}</small>{score.mult1}</span>
              <span className="fx">X</span>
              <span className="f mult"><small>mult<sub>2</sub></small>{score.mult2}</span>
              <span className="fx">=</span>
              <span className="f q"><small>แรงดันไฟรั่ว</small>???</span>
            </div>
            <p className="muted">
              {mustAnswer
                ? 'เบราว์เซอร์นี้อ่านสถานะชาร์จไม่ได้ — ต้องชาร์จด้วยมือ (หรือยืนยันว่าไม่ได้เสียบ) ก่อน'
                : score.powered
                  ? `มีไฟเข้า ${score.live.length ? `และอุปกรณ์ต่อพ่วง ${score.live.length} ชิ้น` : ''} — ผลลัพธ์อาจรุนแรง`
                  : 'ไม่มีไฟเข้าเครื่องเลย ผลลัพธ์น่าจะปลอดภัย (และน่าเบื่อ)'}
            </p>
            {mustAnswer ? (
              <button
                type="button"
                className="btn-gold wide"
                onClick={() => document.querySelector('.power-check')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
              >
                ⚡ ไปชาร์จด้วยมือก่อน (ขั้นที่ 1) ↑
              </button>
            ) : (
              <HoldButton ms={dev && skips.hold ? 300 : 1500} onPrepare={() => window.dispatchEvent(new CustomEvent('ileak:helper-prepare'))} onFire={() => fire(null)}>กดค้างเพื่อจุ่มสายลงน้ำ</HoldButton>
            )}
          </section>
        </>
      )}

      <PlugAssistant stamped={stamped} connected={peripherals.some((card) => card.live)} covered={!!run} />
      {run && (
        <CalcOverlay
          key={run.id}
          score={run.score}
          tier={run.tier}
          speed={dev ? knobs.speed : 1}
          skip={dev && skips.calc}
          auto={queue.length > 0}
          onClose={() => setRun(null)}
        />
      )}
    </main>
  )
}
